#pragma once

#include "Action.h"
#include "Config.h"
#include "Query.h"
#include "Types.h"
#include <ArduinoJson.h>
#include <etl/span.h>

namespace IotCommander
{
  class Device
  {
  public:
    struct Params
    {
      const char* id;
      const char* name;
      const char* requestTopic;
      const char* responseTopic;
      etl::span<Query> queries;
      etl::span<Action> actions;
      ArduinoJson::Allocator& requestAllocator;
      ArduinoJson::Allocator& responseAllocator;
    };

    const char* id;
    const char* name;
    const char* requestTopic;
    const char* responseTopic;
    etl::span<Query> queries;
    etl::span<Action> actions;
    ArduinoJson::Allocator& requestAllocator;
    ArduinoJson::Allocator& responseAllocator;

    Device(Params params) :
      id(params.id),
      name(params.name),
      requestTopic(params.requestTopic),
      responseTopic(params.responseTopic),
      queries(params.queries),
      actions(params.actions),
      requestAllocator(params.requestAllocator),
      responseAllocator(params.responseAllocator)
    {
    }

    void discovery(char* jsonStringResponse, size_t jsonStringResponseSize)
    {
      ArduinoJson::JsonDocument responseDoc(&responseAllocator);
      responseDoc["id"] = id;
      responseDoc["name"] = name;
      responseDoc["requestTopic"] = requestTopic;
      responseDoc["responseTopic"] = responseTopic;
      ArduinoJson::serializeJson(responseDoc, jsonStringResponse, jsonStringResponseSize);
    }

    void schema(
      const char* requestId,
      ArduinoJson::JsonDocument& responseDoc,
      char* jsonStringResponse,
      size_t jsonStringResponseSize
    )
    {
      responseDoc.clear();
      responseDoc["requestId"] = requestId;
      responseDoc["status"] = ResponseStatus::OK;
      auto resultsJson = responseDoc["results"].to<ArduinoJson::JsonObject>();
      auto queriesJson = resultsJson["queries"].to<ArduinoJson::JsonArray>();
      auto actionsJson = resultsJson["actions"].to<ArduinoJson::JsonArray>();
      for (auto& query : queries)
      {
        auto queryJson = queriesJson.add<ArduinoJson::JsonObject>();
        query.serialize(queryJson);
      }
      for (auto& action : actions)
      {
        auto actionJson = actionsJson.add<ArduinoJson::JsonObject>();
        action.serialize(actionJson);
      }
      ArduinoJson::serializeJson(responseDoc, jsonStringResponse, jsonStringResponseSize);
    }

    void writeError(
      etl::optional<const char*> error,
      const char* requestId,
      ArduinoJson::JsonDocument& responseDoc,
      char* jsonStringResponse,
      size_t jsonStringResponseSize
    )
    {
      if (!error.has_value()) return;
      responseDoc.clear();
      responseDoc["requestId"] = requestId;
      responseDoc["status"] = ResponseStatus::ERROR;
      responseDoc["code"] = error.value();
      ArduinoJson::serializeJson(responseDoc, jsonStringResponse, jsonStringResponseSize);
    }

    struct FormatValidationResult
    {
      bool valid;
      const char* requestId;
      RequestType type;
      const char* name;
    };
    FormatValidationResult validateFormat(ArduinoJson::JsonDocument& requestDoc)
    {
      FormatValidationResult result = { .valid = false };
      ArduinoJson::JsonVariant requestIdVariant = requestDoc["requestId"];
      ArduinoJson::JsonVariant actionVariant = requestDoc["action"];
      ArduinoJson::JsonVariant queryVariant = requestDoc["query"];
      ArduinoJson::JsonVariant parametersVariant = requestDoc["parameters"];
      if (requestIdVariant.isNull() || !requestIdVariant.is<const char*>()) return result;
      if (!queryVariant.isNull() && !actionVariant.isNull()) return result;
      if (queryVariant && queryVariant.is<const char*>())
      {
        result.requestId = requestIdVariant.as<const char*>();
        result.type = RequestType::QUERY;
        result.name = queryVariant.as<const char*>();
        result.valid = true;
      }
      else if (
        actionVariant && actionVariant.is<const char*>() &&
        parametersVariant && parametersVariant.is<ArduinoJson::JsonObject>()
        )
      {
        result.requestId = requestIdVariant.as<const char*>();
        result.type = RequestType::ACTION;
        result.name = actionVariant.as<const char*>();
        result.valid = true;
      }
      return result;
    }

    void request(const char* jsonStringRequest, char* jsonStringResponse, size_t jsonStringResponseSize)
    {
      etl::optional<const char*> error;
      ArduinoJson::JsonDocument requestDoc(&requestAllocator);
      ArduinoJson::JsonDocument responseDoc(&responseAllocator);
      ArduinoJson::DeserializationError jsonError = ArduinoJson::deserializeJson(requestDoc, jsonStringRequest);
      if (jsonError)
      {
        IOTC_LOG(LibraryErrors::INVALID_JSON);
        return;
      }

      auto formatValidationResult = validateFormat(requestDoc);
      if (!formatValidationResult.valid)
      {
        writeError(LibraryErrors::INVALID_FORMAT, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
        return;
      }

      ArduinoJson::JsonObject parametersJson = requestDoc["parameters"].as<ArduinoJson::JsonObject>();
      Query* query = nullptr;
      Action* action = nullptr;
      HandlerValue handlerParameters[IOTC_MAX_PARAMETERS];
      HandlerValue handlerResults[IOTC_MAX_RESULTS];

      if (formatValidationResult.type == RequestType::QUERY)
      {
        if (strcmp(IOTC_SCHEMA_QUERY, formatValidationResult.name) == 0)
        {
          schema(formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
          return;
        }

        for (auto& item : queries)
        {
          if (strcmp(item.name, formatValidationResult.name) == 0)
          {
            query = &item;
            break;
          }
        }

        if (!query)
        {
          writeError(LibraryErrors::QUERY_NOT_FOUND, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
          return;
        }

        IOTC_LOG("Query handler begin");
        query->handler(handlerResults, error);
        IOTC_LOG("Query handler end");
        if (error.has_value())
        {
          writeError(error, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
          return;
        }

        auto resultsJson = responseDoc["results"].to<ArduinoJson::JsonObject>();
        for (size_t i = 0; i < query->results.size(); i++)
        {
          bool valid = query->results[i].validateResult(handlerResults[i], resultsJson);
          if (!valid)
          {
            writeError(LibraryErrors::INVALID_PARAMETERS, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
            return;
          }

        }
        responseDoc["requestId"] = formatValidationResult.requestId;
        responseDoc["status"] = ResponseStatus::OK;
        ArduinoJson::serializeJson(responseDoc, jsonStringResponse, jsonStringResponseSize);
      }
      else if (formatValidationResult.type == RequestType::ACTION)
      {
        for (auto& item : actions)
        {
          if (strcmp(item.name, formatValidationResult.name) == 0)
          {
            action = &item;
            break;
          }
        }
        if (!action)
        {
          writeError(LibraryErrors::ACTION_NOT_FOUND, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
          return;
        }

        for (size_t i = 0; i < action->parameters.size(); i++)
        {
          bool valid = action->parameters[i].validateParameter(parametersJson, handlerParameters[i]);
          if (!valid)
          {
            writeError(LibraryErrors::INVALID_PARAMETERS, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
            return;
          }
        }

        IOTC_LOG("Handler begin");
        action->handler(handlerParameters, handlerResults, error);
        IOTC_LOG("Handler end");
        if (error.has_value())
        {
          writeError(error, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
          return;
        }

        auto resultsJson = responseDoc["results"].to<ArduinoJson::JsonObject>();
        for (size_t i = 0; i < action->results.size(); i++)
        {
          bool valid = action->results[i].validateResult(handlerResults[i], resultsJson);
          if (!valid)
          {
            writeError(LibraryErrors::INVALID_RESULTS, formatValidationResult.requestId, responseDoc, jsonStringResponse, jsonStringResponseSize);
            return;
          }
        }
        responseDoc["requestId"] = formatValidationResult.requestId;
        responseDoc["status"] = ResponseStatus::OK;
        ArduinoJson::serializeJson(responseDoc, jsonStringResponse, jsonStringResponseSize);
      }
    }
  };
}
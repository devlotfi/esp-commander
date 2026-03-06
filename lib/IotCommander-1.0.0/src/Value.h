#pragma once

#include "Config.h"
#include "Serializable.h"
#include "Types.h"
#include <etl/optional.h>
#include <etl/span.h>
#include <etl/variant.h>

namespace IotCommander
{
  class Value : public Serializable
  {
  public:
    struct Params
    {
      const char* name;
      ValueType type;
      bool required;
      etl::optional<int> min;
      etl::optional<int> max;
      etl::optional<etl::span<const char*>> enumDefinition;
    };

    const char* name;
    ValueType type;
    bool required;
    int min = 0;
    int max = 0;
    etl::span<const char*> enumDefinition;

    Value(Params params) :
      name(params.name),
      type(params.type),
      required(params.required)
    {
      if (type == ValueType::RANGE && params.min.has_value() && params.max.has_value())
      {
        min = params.min.value();
        max = params.max.value();
      }
      else if (type == ValueType::ENUM && params.enumDefinition.has_value())
      {
        enumDefinition = params.enumDefinition.value();
      }
    }

    void serialize(ArduinoJson::JsonObject& obj) override {
      obj["name"] = name;
      obj["type"] = type.to_string();
      obj["required"] = required;
      if (type == ValueType::RANGE)
      {
        obj["min"] = min;
        obj["max"] = max;
      }
      else if (type == ValueType::ENUM)
      {
        auto arr = obj["enumDefinition"].to<ArduinoJson::JsonArray>();
        for (auto& item : enumDefinition)
        {
          arr.add(item);
        }
      }
    }

    bool isValidHexColor(const char* str)
    {
      if (!str) return false;
      if (strlen(str) != 7) return false;
      if (str[0] != '#') return false;
      for (int i = 1; i < 7; ++i)
      {
        char c = str[i];
        bool isDigit = (c >= '0' && c <= '9');
        bool isUpper = (c >= 'A' && c <= 'F');
        bool isLower = (c >= 'a' && c <= 'f');
        if (!(isDigit || isUpper || isLower))
          return false;
      }
      return true;
    }

    bool validateParameter(ArduinoJson::JsonObject& jsonValues, HandlerValue& handlerValue)
    {
      ArduinoJson::JsonVariant valueVariant = jsonValues[name];
      if (valueVariant.isNull() && !required) return true;
      if (valueVariant.isNull()) return false;

      if (type == ValueType::INT)
      {
        using Type = int;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        handlerValue.emplace(value);
      }
      else if (type == ValueType::RANGE)
      {
        using Type = int;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        if (value < min || value > max) return false;
        handlerValue.emplace(value);
      }
      else if (type == ValueType::FLOAT)
      {
        using Type = float;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        handlerValue.emplace(value);
      }
      else if (type == ValueType::DOUBLE)
      {
        using Type = double;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        handlerValue.emplace(value);
      }
      else if (type == ValueType::BOOL)
      {
        using Type = bool;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        handlerValue.emplace(value);
      }
      else if (type == ValueType::STRING)
      {
        using Type = const char*;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        handlerValue.emplace(value);
      }
      else if (type == ValueType::ENUM)
      {
        using Type = const char*;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        bool found = false;
        for (auto& item : enumDefinition)
        {
          if (strcmp(item, value) == 0)
          {
            found = true;
            break;
          }
        }
        if (!found) return false;
        handlerValue.emplace(value);
      }
      else if (type == ValueType::COLOR)
      {
        using Type = const char*;
        if (!valueVariant.is<Type>()) return false;
        auto value = valueVariant.as<Type>();
        if (!isValidHexColor(value)) return false;
        handlerValue.emplace(value);
      }
      return true;
    }
    bool validateResult(HandlerValue& handlerValue, ArduinoJson::JsonObject& jsonValues)
    {
      if (!handlerValue.has_value() && !required) return true;
      if (!handlerValue.has_value()) return false;

      if (type == ValueType::INT)
      {
        using Type = int;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      else if (type == ValueType::RANGE)
      {
        using Type = int;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        if (value < min || value > max) return false;
        jsonValues[name] = value;
      }
      else if (type == ValueType::FLOAT)
      {
        using Type = float;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      else if (type == ValueType::DOUBLE)
      {
        using Type = double;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      else if (type == ValueType::BOOL)
      {
        using Type = bool;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      else if (type == ValueType::STRING)
      {
        using Type = const char*;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      else if (type == ValueType::ENUM)
      {
        using Type = const char*;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        bool found = false;
        for (auto& item : enumDefinition)
        {
          if (strcmp(item, value) == 0)
          {
            found = true;
            break;
          }
        }
        if (!found) return false;
        jsonValues[name] = value;
      }
      else if (type == ValueType::COLOR)
      {
        using Type = const char*;
        auto optionalValue = handlerValue.value();
        if (!etl::holds_alternative<Type>(optionalValue)) return false;
        auto value = etl::get<Type>(optionalValue);
        jsonValues[name] = value;
      }
      return true;
    }
  };
}
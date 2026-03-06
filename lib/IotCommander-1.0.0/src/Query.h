#pragma once

#include "Config.h"
#include "Serializable.h"
#include "Types.h"
#include "Value.h"
#include <ArduinoJson.h>
#include <etl/span.h>

namespace IotCommander
{
  class Query : public Serializable
  {
  public:
    struct Params
    {
      const char* name;
      etl::span<Value> results;
      QueryHandler handler;
    };

    const char* name;
    etl::span<Value> results;
    QueryHandler handler;

    Query(Params params) :
      name(params.name),
      results(params.results),
      handler(params.handler)
    {
    }

    void serialize(ArduinoJson::JsonObject& obj) override
    {
      obj["name"] = name;
      for (auto item : results)
      {
        auto parameterObj = obj["results"].add<ArduinoJson::JsonObject>();
        item.serialize(parameterObj);
      }
    }
  };
}
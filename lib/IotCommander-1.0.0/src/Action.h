#pragma once


#include "Config.h"
#include "Serializable.h"
#include "Types.h"
#include "Value.h"
#include <ArduinoJson.h>
#include <etl/span.h>


namespace IotCommander
{
  class Action : public Serializable
  {
  public:
    struct Params
    {
      const char* name;
      etl::span<Value> parameters;
      etl::span<Value> results;
      ActionHandler handler;
    };

    const char* name;
    etl::span<Value> parameters;
    etl::span<Value> results;
    ActionHandler handler;

    Action(Params params) :
      name(params.name),
      parameters(params.parameters),
      results(params.results),
      handler(params.handler)
    {
    }

    void serialize(ArduinoJson::JsonObject& obj) override
    {
      obj["name"] = name;
      for (auto item : parameters)
      {
        auto parameterObj = obj["parameters"].add<ArduinoJson::JsonObject>();
        item.serialize(parameterObj);
      }
      for (auto item : results)
      {
        auto parameterObj = obj["results"].add<ArduinoJson::JsonObject>();
        item.serialize(parameterObj);
      }
    }
  };
}
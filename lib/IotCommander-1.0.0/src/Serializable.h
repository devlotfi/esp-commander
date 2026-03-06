#pragma once

#include <ArduinoJson.h>

namespace IotCommander
{
  class Serializable
  {
  public:
    virtual void serialize(ArduinoJson::JsonObject&) = 0;
  };
}
#pragma once

#include "Config.h"
#include <etl/optional.h>
#include <etl/variant.h>

namespace IotCommander
{
  using HandlerValue = etl::optional<etl::variant<int, float, double, bool, const char*>>;
  using QueryHandler = void (*)(HandlerValue[], etl::optional<const char*>&);
  using ActionHandler = void (*)(HandlerValue[], HandlerValue[], etl::optional<const char*>&);

  class ValueType
  {
  public:
    enum ValueTypeEnum
    {
      INT,
      RANGE,
      FLOAT,
      DOUBLE,
      BOOL,
      STRING,
      ENUM,
      COLOR
    };

    ValueTypeEnum val;
    constexpr ValueType(ValueTypeEnum v) : val(v) {}
    constexpr operator ValueTypeEnum() const { return val; }
    explicit operator bool() = delete;

    const char* to_string() const {
      switch (val) {
      case ValueTypeEnum::INT: { return "INT"; }
      case ValueTypeEnum::RANGE: { return "RANGE"; };
      case ValueTypeEnum::FLOAT: { return "FLOAT"; };
      case ValueTypeEnum::DOUBLE: { return "DOUBLE"; };
      case ValueTypeEnum::BOOL: { return "BOOL"; };
      case ValueTypeEnum::STRING: { return "STRING"; };
      case ValueTypeEnum::ENUM: { return "ENUM"; };
      case ValueTypeEnum::COLOR: { return "COLOR"; };
      default: { return "Unknown"; };
      }
    }
  };



  enum RequestType
  {
    QUERY,
    ACTION
  };

  class LibraryErrors
  {
  public:
    static constexpr const char* INVALID_JSON = "INVALID_JSON";
    static constexpr const char* INVALID_FORMAT = "INVALID_FORMAT";
    static constexpr const char* ACTION_NOT_FOUND = "ACTION_NOT_FOUND";
    static constexpr const char* QUERY_NOT_FOUND = "QUERY_NOT_FOUND";
    static constexpr const char* INVALID_PARAMETERS = "INVALID_PARAMETERS";
    static constexpr const char* INVALID_RESULTS = "INVALID_RESULTS";
  };

  class ResponseStatus
  {
  public:
    static constexpr const char* OK = "OK";
    static constexpr const char* ERROR = "ERROR";
  };
}
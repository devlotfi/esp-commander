import { cn, ColorSwatch } from "@heroui/react";
import type { ComponentProps } from "react";
import {
  ValueType,
  type AllowedTypes,
  type Value,
} from "../../types/handler-call";

interface ValueRowProps extends ComponentProps<"div"> {
  value: Value;
  valueData?: AllowedTypes;
}

export default function ValueRow({
  value,
  valueData,
  className,
  ...props
}: ValueRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-[0.3rem] md:flex-row md:gap-[0.5rem] md:mb-0",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 justify-between items-center gap-[0.7rem]">
        <div className="flex gap-[0.5rem]">
          <div className="flex text-[12pt] text-accent gap-[0.5rem]">
            <div className="flex">{value.type} </div>
            {value.type === ValueType.RANGE ? (
              <div className="flex">
                [{value.min} , {value.max}]
              </div>
            ) : null}
            {value.type === ValueType.ENUM && value.enumDefinition ? (
              <div className="flex">({value.enumDefinition.join(", ")})</div>
            ) : null}
          </div>
          <div className="flex text-[12pt] opacity-80">{value.name}</div>
        </div>
        <div className="flex h-[1px] flex-1 bg-separator"></div>
      </div>
      {valueData !== undefined ? (
        <div className="flex items-center gap-[0.5rem]">
          {value.type === ValueType.COLOR && valueData ? (
            <ColorSwatch
              aria-label="color"
              color={valueData as string}
              size="sm"
            />
          ) : null}

          <div
            className={cn(
              "flex items-center text-[12pt] break-all",
              typeof valueData === "boolean" &&
                (valueData ? "text-success" : "text-danger"),
            )}
          >
            {typeof valueData === "string"
              ? valueData
              : JSON.stringify(valueData)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

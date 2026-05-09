import { Chip, cn } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

interface DataRowProps extends ComponentProps<"div"> {
  name: ReactNode;
  value: string;
  fold?: boolean;
}

export default function DataRow({
  name,
  value,
  fold = false,
  className,
  ...props
}: DataRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-[0.3rem]",
        !fold && "md:flex-row md:items-center md:gap-[0.5rem] md:mb-0",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 justify-between items-center gap-[0.7rem]">
        <Chip size="md" className="text-[12pt] font-normal">
          <Chip.Label>{name}</Chip.Label>
        </Chip>
        <div
          className={cn(
            "flex h-[1px] flex-1 bg-[linear-gradient(to_right,var(--separator),transparent)] md:bg-[linear-gradient(to_right,transparent,var(--separator),transparent)]",
            fold &&
              "!bg-[linear-gradient(to_right,var(--separator),transparent)]",
          )}
        ></div>
      </div>
      <div className="flex text-[12pt] break-all">{value}</div>
    </div>
  );
}

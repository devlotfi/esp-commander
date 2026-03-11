import { cn } from "@heroui/react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { type ComponentProps, type PropsWithChildren } from "react";

interface SectionHeaderProps extends ComponentProps<"div"> {
  icon: IconName;
  iconWrapperProps?: ComponentProps<"div">;
  labelProps?: ComponentProps<"div">;
}

export default function SectionHeader({
  children,
  icon,
  className,
  iconWrapperProps: {
    className: classNameIconWrapper,
    ...iconWrapperProps
  } = {},
  labelProps: { className: classNameLabel, ...labelProps } = {},
  ...props
}: PropsWithChildren<SectionHeaderProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-[1rem] md:gap-[2rem] py-[2rem]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex justify-center items-center rounded-2xl size-[3rem] bg-accent",
          classNameIconWrapper,
        )}
        style={{
          boxShadow:
            "color-mix(in srgb, var(--accent), transparent 30%) 0 0 3rem 0",
        }}
        {...iconWrapperProps}
      >
        <DynamicIcon
          name={icon}
          className="text-accent-foreground size-[2rem]"
        ></DynamicIcon>
      </div>
      <div
        className={cn("flex font-bold text-[20pt] uppercase", classNameLabel)}
        {...labelProps}
      >
        {children}
      </div>
    </div>
  );
}

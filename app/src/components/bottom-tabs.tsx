import { Button, cn, type ButtonProps } from "@heroui/react";
import {
  useMatch,
  useNavigate,
  type FileRouteTypes,
} from "@tanstack/react-router";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

function BottomTabsButton({
  path,
  icon,
  children,
  className,
  ...props
}: Omit<ButtonProps, "children"> &
  PropsWithChildren<{
    path: FileRouteTypes["to"];
    icon: IconName;
  }>) {
  const navigate = useNavigate();
  const isActive = useMatch({ from: path, shouldThrow: false });

  return (
    <Button
      fullWidth
      variant="ghost"
      className={cn("min-w-auto h-auto bg-transparent px-0", className)}
      onPress={() => {
        navigate({ to: path });
      }}
      {...props}
    >
      <div className="flex flex-col items-center p-[0.3rem] gap-[0.2rem]">
        <div
          className={cn(
            "flex justify-center items-center size-[2rem] rounded-[0.5rem]",
            isActive && "bg-accent",
          )}
        >
          <DynamicIcon
            name={icon}
            color={isActive ? "var(--accent-foreground)" : "var(--foreground)"}
            className="h-[1.3rem] w-[1.3rem]"
          ></DynamicIcon>
        </div>
        <div
          className={cn(
            "flex text-[10pt] font-medium text-foreground whitespace-break-spaces",
            isActive && "text-accent",
          )}
        >
          {children}
        </div>
      </div>
    </Button>
  );
}

export default function BottomTabs() {
  const { t } = useTranslation();

  return (
    <div
      className="flex md:hidden h-[5.5rem] rounded-tl-4xl rounded-tr-4xl md:rounded-none md:pl-0 bg-[color-mix(in_srgb,var(--surface),transparent_85%)] border-t"
      style={{
        boxShadow:
          "color-mix(in srgb, var(--surface), transparent 80%) 0px 3px 0px inset",
      }}
    >
      <div className="flex items-center w-full gap-[0.5rem] p-[0.3rem]">
        <BottomTabsButton path="/" icon={"cpu"}>
          {t("devices")}
        </BottomTabsButton>
        <BottomTabsButton path="/connections" icon={"satellite-dish"}>
          {t("connections")}
        </BottomTabsButton>
        <BottomTabsButton path="/ai" icon={"brain-circuit"}>
          {t("ai")}
        </BottomTabsButton>
        <BottomTabsButton path="/settings" icon={"settings"}>
          {t("settings")}
        </BottomTabsButton>
      </div>
    </div>
  );
}

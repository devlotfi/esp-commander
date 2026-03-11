import { motion } from "motion/react";
import { useContext, type PropsWithChildren } from "react";
import { AppContext } from "../context/app-context";
import { Button, cn, Tooltip, type ButtonProps } from "@heroui/react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import {
  useMatch,
  useNavigate,
  type FileRouteTypes,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "../hooks/use-media-query";

function SidebarButton({
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
  const { sidebarOpen } = useContext(AppContext);
  const isLarge = useMediaQuery("(min-width: 1024px)");

  return (
    <Tooltip delay={0} isDisabled={isLarge && sidebarOpen}>
      <Button
        variant="outline"
        className={cn(
          "justify-between h-auto p-[0.4rem] border border-transparent",
          "transition-all duration-300",
          sidebarOpen ? "lg:w-full" : "gap-0 w-auto",
          isActive &&
            "bg-[color-mix(in_srgb,var(--surface),transparent_80%)] border-border",
          !isActive && "shadow-none",
          className,
        )}
        onPress={() => {
          navigate({ to: path });
        }}
        {...props}
      >
        <>
          <div
            className={cn(
              "flex justify-center items-center min-h-[2.2rem] min-w-[2.2rem] rounded-2xl",
              "transition-colors duration-300",
              isActive && "bg-accent",
            )}
          >
            <DynamicIcon
              name={icon}
              color={
                isActive ? "var(--accent-foreground)" : "var(--foreground)"
              }
              className="h-[1.5rem] w-[1.5rem] transition-colors duration-300"
            />
          </div>

          <motion.div
            initial={false}
            animate={{
              width: sidebarOpen ? "auto" : 0,
              opacity: sidebarOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="hidden lg:flex overflow-hidden flex-1 justify-center text-center"
          >
            <div
              className={cn(
                "whitespace-nowrap text-[11pt] font-medium text-foreground",
                "transition-colors duration-300",
                isActive && "text-accent",
              )}
            >
              {children}
            </div>
          </motion.div>
        </>
      </Button>

      <Tooltip.Content showArrow placement="right">
        <Tooltip.Arrow />
        {children}
      </Tooltip.Content>
    </Tooltip>
  );
}

function GithubButton({ className, ...props }: Omit<ButtonProps, "children">) {
  const { sidebarOpen } = useContext(AppContext);
  const isLarge = useMediaQuery("(min-width: 1024px)");

  return (
    <Tooltip delay={0} isDisabled={isLarge && sidebarOpen}>
      <a
        href="https://github.com/devlotfi/iot-commander"
        target="_blank"
        className="flex flex-1 justify-center items-center"
      >
        <Button
          variant="outline"
          className={cn(
            "justify-between h-auto p-[0.4rem] py-[0.2rem] bg-[color-mix(in_srgb,var(--surface),transparent_80%)] border border-border",
            "transition-all duration-300",
            sidebarOpen ? "lg:w-full" : "gap-0 w-auto",
            className,
          )}
          {...props}
        >
          <>
            <div
              className={cn(
                "flex justify-center items-center min-h-[2.2rem] min-w-[2.2rem] rounded-2xl",
                "transition-colors duration-300",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="size-[2rem]"
              >
                <path
                  className="fill-foreground"
                  d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"
                />
              </svg>
            </div>

            <motion.div
              initial={false}
              animate={{
                width: sidebarOpen ? "auto" : 0,
                opacity: sidebarOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="hidden lg:flex overflow-hidden flex-1 justify-center text-center"
            >
              <div
                className={cn(
                  "whitespace-nowrap text-[11pt] font-medium text-foreground",
                  "transition-colors duration-300",
                )}
              >
                Github
              </div>
            </motion.div>
          </>
        </Button>
      </a>

      <Tooltip.Content showArrow placement="right">
        <Tooltip.Arrow />
        Github
      </Tooltip.Content>
    </Tooltip>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  const { sidebarOpen } = useContext(AppContext);

  return (
    <div className="hidden md:flex p-[1rem]">
      <div
        className={cn(
          "flex relative flex-col min-w-[5rem] duration-500 transition-[width] bg-[color-mix(in_srgb,var(--surface),transparent_85%)] border rounded-3xl",
          sidebarOpen ? "lg:w-[16rem]" : "w-[5rem]",
        )}
        style={{
          boxShadow:
            "color-mix(in srgb, var(--surface), transparent 80%) 0px -3px 0px inset",
        }}
      >
        <div className="flex flex-col flex-1 justify-center items-center gap-[0.5rem] p-[0.7rem]">
          <SidebarButton path="/" icon={"cpu"}>
            {t("devices")}
          </SidebarButton>
          <SidebarButton path="/connections" icon={"satellite-dish"}>
            {t("connections")}
          </SidebarButton>
          <SidebarButton path="/settings" icon={"settings"}>
            {t("settings")}
          </SidebarButton>
        </div>

        <div className="flex p-[0.7rem] justify-center items-center w-full absolute bottom-0">
          <GithubButton></GithubButton>
        </div>
      </div>
    </div>
  );
}

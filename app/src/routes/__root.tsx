import * as React from "react";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import BottomTabs from "../components/bottom-tabs";
import { ScrollShadow } from "@heroui/react";
import type { RouterContext } from "../types/router-context";
import RouteLoading from "../components/route-loading";
import { AppContext } from "../context/app-context";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { scrollRef } = React.useContext(AppContext);

  return (
    <React.Fragment>
      <RouteLoading></RouteLoading>

      <div className="flex flex-1">
        <Sidebar></Sidebar>
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar></Navbar>
          <ScrollShadow
            ref={scrollRef}
            className="flex h-[calc(100dvh-4rem-5rem)] md:h-[calc(100dvh-6rem)] min-w-0 overflow-x-hidden overflow-y-auto"
            style={{
              scrollbarColor:
                "color-mix(in srgb, var(--accent), transparent 30%) color-mix(in srgb, var(--surface), transparent 80%)",
              scrollbarWidth: "thin",
            }}
          >
            <Outlet />
          </ScrollShadow>
          <BottomTabs></BottomTabs>
        </div>
      </div>
    </React.Fragment>
  );
}

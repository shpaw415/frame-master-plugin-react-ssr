import { createContext, useCallback, useEffect, useState } from "react";
import type { JSX } from "react";
import { join, routeGetter } from "@/utils";
import { DevProvider } from "@/client/dev";
import { useRequest } from "@/hooks";
import { StackLayouts, layoutGetter } from "@/router/layout";

type RouterHostParams = {
  initialPath: currentRouteType;
  children: JSX.Element;
};

type currentRouteType = {
  pathname: string;
  searchParams: URLSearchParams;
};

type RouteSetter = (
  to: string,
  searchParams?: Record<string, string> | URLSearchParams
) => void;

export type CurrentRouteContextType = currentRouteType & {
  navigate: RouteSetter;
  reload: () => void;
};

export const CurrentRouteContext =
  createContext<CurrentRouteContextType | null>(null);

export function RouterHost({ initialPath, children }: RouterHostParams) {
  const [route, setRoute] = useState<currentRouteType>(initialPath);
  const [currentPageElement, setCurrentPageElement] =
    useState<JSX.Element>(children);

  const request = useRequest();

  const loadRoutePageModule = useCallback(async (path: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("t", new Date().getTime().toString());

    const url =
      join(
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir,
        path,
        "index.js"
      ) +
      (process.env.NODE_ENV != "production"
        ? `?${searchParams.toString()}`
        : "");
    const _module = (await import(url.startsWith("/") ? url : "/" + url)) as {
      default: () => JSX.Element;
    };
    setCurrentPageElement(
      <StackLayouts
        layouts={(
          await layoutGetter(
            path,
            routeGetter(request),
            globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir
          )
        ).map((_module) => _module.default)}
      >
        <_module.default />
      </StackLayouts>
    );
  }, []);

  const routeSetter = useCallback(
    (to: string, searchParams?: Record<string, string> | URLSearchParams) => {
      const newSearchParams = new URLSearchParams(searchParams);
      const urlPath = newSearchParams.toString()
        ? `${to}?${newSearchParams.toString()}`
        : to;

      window.history.pushState(null, "", urlPath);

      setRoute({
        pathname: to,
        searchParams: newSearchParams,
      });
      loadRoutePageModule(to);
    },
    [loadRoutePageModule]
  );

  const reloadRoute = useCallback(() => {
    loadRoutePageModule(
      route.pathname.startsWith("/") ? route.pathname : "/" + route.pathname
    );
  }, [route.pathname, loadRoutePageModule]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      routeSetter(url.pathname, url.searchParams);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadRoutePageModule, routeSetter]);

  return (
    <CurrentRouteContext.Provider
      value={{ ...route, navigate: routeSetter, reload: reloadRoute }}
    >
      <DevProvider>{currentPageElement}</DevProvider>
    </CurrentRouteContext.Provider>
  );
}

import { createContext, useCallback, useContext, useState } from "react";
import type { JSX } from "react";
import { join, routeGetter } from "@/utils";
import { DevProvider } from "@/client/dev";
import { useRequest } from "@/hooks";
import {
  StackLayouts,
  importLayouts,
  getRelatedLayoutPaths,
  layoutGetter,
} from "@/router/layout";

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

const CurrentRouteContext = createContext<
  (currentRouteType & { navigate: RouteSetter; reload: () => void }) | null
>(null);
export function useRoute() {
  return useContext(CurrentRouteContext)!;
}

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
      (process.env.NODE_ENV === "development"
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
      setRoute({
        pathname: to,
        searchParams: new URLSearchParams(searchParams),
      });
      loadRoutePageModule(to);
    },
    []
  );

  const reloadRoute = useCallback(() => {
    loadRoutePageModule(
      route.pathname.startsWith("/") ? route.pathname : "/" + route.pathname
    );
  }, [route.pathname, loadRoutePageModule]);

  return (
    <CurrentRouteContext.Provider
      value={{ ...route, navigate: routeSetter, reload: reloadRoute }}
    >
      <DevProvider>{currentPageElement}</DevProvider>
    </CurrentRouteContext.Provider>
  );
}

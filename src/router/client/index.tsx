import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import { join, routeGetter } from "../../utils";
import { DevProvider } from "../../client/dev";
import { useRequest } from "../../hooks";
import { StackLayouts, layoutGetter } from "../../router/layout";
import { ServerSidePropsProvider } from "../../features/serverSideProps/client";

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
  isInitial: boolean;
  /** increment every time navigate or reload is triggered */
  version: number;
};

export const CurrentRouteContext = createContext<CurrentRouteContextType>(
  null as any
);

export function RouterHost({ initialPath, children }: RouterHostParams) {
  const [route, setRoute] = useState<currentRouteType>(initialPath);
  const [currentPageElement, setCurrentPageElement] =
    useState<JSX.Element>(children);
  const [isInitialRoute, setIsInitialRoute] = useState(true);
  const [routeVersion, setRouteVersion] = useState(0);

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
      setIsInitialRoute(false);
      setRouteVersion((c) => c++);
      loadRoutePageModule(to);
    },
    [loadRoutePageModule]
  );

  const reloadRoute = useCallback(() => {
    loadRoutePageModule(
      route.pathname.startsWith("/") ? route.pathname : "/" + route.pathname
    );
    setIsInitialRoute(false);
    setRouteVersion((c) => c++);
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

  const RouteContextMemo = useMemo(
    () => ({
      ...route,
      navigate: routeSetter,
      reload: reloadRoute,
      isInitial: isInitialRoute,
      version: routeVersion,
    }),
    [routeSetter, reloadRoute, route, isInitialRoute, routeVersion]
  );

  return (
    <CurrentRouteContext.Provider value={RouteContextMemo}>
      <DevProvider>
        <ServerSidePropsProvider>{currentPageElement}</ServerSidePropsProvider>
      </DevProvider>
    </CurrentRouteContext.Provider>
  );
}

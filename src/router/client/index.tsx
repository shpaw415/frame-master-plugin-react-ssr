import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { join, routeGetter } from "../../utils";
import { DevProvider } from "../../client/dev";
import { StackLayouts, layoutGetter } from "../../router/layout";
import { ServerSidePropsProvider } from "../../hooks/providers";
import {
  CurrentRouteContext,
  type currentRouteType,
} from "../../hooks/contexts";
import { useRequest } from "../../hooks";

type RouterHostParams = {
  children: JSX.Element;
};

/**
 * default client Router Host from frame-master-plugin-react-ssr
 * @returns
 */
export function RouterHost({ children }: RouterHostParams) {
  const request = useRequest();
  const [route, setRoute] = useState<currentRouteType>(
    request
      ? {
          pathname: request.URL.pathname,
          searchParams: request.URL.searchParams,
        }
      : {
          pathname: window.location.pathname,
          searchParams: window.location.search
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams(),
        }
  );
  const [currentPageElement, setCurrentPageElement] =
    useState<JSX.Element>(children);
  const [isInitialRoute, setIsInitialRoute] = useState(true);
  const [routeVersion, setRouteVersion] = useState(0);

  // Use ref instead of state to avoid re-renders and stale closures
  const abortControllerRef = useRef(new AbortController());

  const loadRoutePageModule = useCallback(
    async (path: string) => {
      // Abort any previous ongoing navigation
      try {
        abortControllerRef.current.abort("page-change");
      } catch {}
      // Create a new controller for this navigation
      const newController = new AbortController();
      abortControllerRef.current = newController;

      const url = new URL(
        join(
          globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir,
          path,
          "index.js"
        ),
        window.location.origin
      );

      if (process.env.NODE_ENV != "production")
        url.searchParams.set("t", new Date().getTime().toString());

      try {
        const _module = (await import(url.toString())) as {
          default: () => JSX.Element;
        };

        // Check if this navigation was aborted
        if (newController.signal.aborted) {
          return;
        }

        const layouts = globalThis.__REACT_SSR_PLUGIN_OPTIONS__.enableLayout
          ? await layoutGetter(
              path,
              routeGetter(request),
              globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir
            )
          : [];

        // Check again after async operation
        if (newController.signal.aborted) {
          return;
        }

        setCurrentPageElement(
          <StackLayouts layouts={layouts.map((_module) => _module.default)}>
            <_module.default />
          </StackLayouts>
        );
      } catch (error) {
        // Silently ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        // Check if it was aborted
        if (newController.signal.aborted) {
          return;
        }
        // Re-throw other errors
        throw error;
      }
    },
    [request]
  );

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
      setRouteVersion((c) => c + 1);
      loadRoutePageModule(to).then(() => {
        // scroll to top after navigation smootly
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [loadRoutePageModule]
  );

  // Keep route pathname in a ref to avoid dependency issues
  const routePathnameRef = useRef(route.pathname);
  const searchParamsString = useMemo(
    () => route.searchParams.toString(),
    [route.searchParams]
  );

  useEffect(() => {
    routePathnameRef.current = route.pathname;
  }, [route.pathname]);

  const reloadRoute = useCallback(() => {
    const currentPath = routePathnameRef.current.startsWith("/")
      ? routePathnameRef.current
      : "/" + routePathnameRef.current;
    loadRoutePageModule(currentPath);
    setIsInitialRoute(false);
    setRouteVersion((c) => c + 1);
  }, [loadRoutePageModule]);

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

  const RouteContextMemo = useMemo(() => {
    return {
      pathname: route.pathname,
      searchParams: route.searchParams,
      navigate: routeSetter,
      reload: reloadRoute,
      isInitial: isInitialRoute,
      version: routeVersion,
    };
  }, [
    route.pathname,
    searchParamsString,
    routeSetter,
    reloadRoute,
    isInitialRoute,
    routeVersion,
  ]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");

      if (target instanceof HTMLAnchorElement && target.href) {
        const url = new URL(target.href);

        if (
          url.origin === window.location.origin &&
          !target.target &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          e.preventDefault();
          RouteContextMemo.navigate(url.pathname + url.search + url.hash);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [RouteContextMemo.navigate]);

  return (
    <CurrentRouteContext.Provider value={RouteContextMemo}>
      <DevProvider>
        <ServerSidePropsProvider abortController={abortControllerRef.current}>
          {currentPageElement}
        </ServerSidePropsProvider>
      </DevProvider>
    </CurrentRouteContext.Provider>
  );
}

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
 * Scrolls to an anchor element if hash is present, otherwise scrolls to top
 */
function scrollToAnchor(hash: string, behavior: ScrollBehavior = "smooth") {
  if (hash && hash.startsWith("#")) {
    const id = hash.substring(1);
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({ behavior, block: "start" });
      return;
    }
  }

  // If no hash or element not found, scroll to top
  window.scrollTo({ top: 0, behavior });
}

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
  const [currentHash, setCurrentHash] = useState(
    request ? "" : window.location.hash
  );

  // Use ref instead of state to avoid re-renders and stale closures
  const abortControllerRef = useRef(new AbortController());
  const navigationTimeoutRef = useRef<number | null>(null);

  const loadRoutePageModule = useCallback(
    async (path: string, hash?: string) => {
      // Abort any previous ongoing navigation
      try {
        abortControllerRef.current.abort("page-change");
      } catch {}

      // Clear any pending scroll timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

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

        // Schedule scroll after component renders
        // Use requestAnimationFrame to ensure DOM is updated
        navigationTimeoutRef.current = window.setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToAnchor(hash || "", "smooth");
          });
        }, 50);
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
      // Parse the URL to separate pathname, hash, and search params
      const url = new URL(to, window.location.origin);
      const pathname = url.pathname;
      const hash = url.hash;

      // Merge search params
      const newSearchParams = new URLSearchParams(
        searchParams || url.searchParams
      );

      const urlPath = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}${hash}`
        : `${pathname}${hash}`;

      window.history.pushState(null, "", urlPath);

      setRoute({
        pathname,
        searchParams: newSearchParams,
      });
      setCurrentHash(hash);
      setIsInitialRoute(false);
      setRouteVersion((c) => c + 1);
      loadRoutePageModule(pathname, hash);
    },
    [loadRoutePageModule]
  );

  // Keep route pathname in a ref to avoid dependency issues
  const routePathnameRef = useRef(route.pathname);
  const currentHashRef = useRef(currentHash);
  const searchParamsString = useMemo(
    () => route.searchParams.toString(),
    [route.searchParams]
  );

  useEffect(() => {
    routePathnameRef.current = route.pathname;
  }, [route.pathname]);

  useEffect(() => {
    currentHashRef.current = currentHash;
  }, [currentHash]);

  const reloadRoute = useCallback(() => {
    const currentPath = routePathnameRef.current.startsWith("/")
      ? routePathnameRef.current
      : "/" + routePathnameRef.current;
    loadRoutePageModule(currentPath, currentHashRef.current);
    setIsInitialRoute(false);
    setRouteVersion((c) => c + 1);
  }, [loadRoutePageModule]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      routeSetter(url.pathname + url.search + url.hash, url.searchParams);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [routeSetter]);

  const RouteContextMemo = useMemo(() => {
    return {
      pathname: route.pathname,
      searchParams: route.searchParams,
      navigate: routeSetter,
      reload: reloadRoute,
      isInitial: isInitialRoute,
      version: routeVersion,
      hash: currentHash,
    };
  }, [
    route.pathname,
    searchParamsString,
    routeSetter,
    reloadRoute,
    isInitialRoute,
    routeVersion,
    currentHash,
  ]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");

      if (target instanceof HTMLAnchorElement && target.href) {
        const url = new URL(target.href);

        // Handle same-page anchor links
        if (
          url.origin === window.location.origin &&
          url.pathname === window.location.pathname &&
          url.hash
        ) {
          e.preventDefault();
          window.history.pushState(
            null,
            "",
            url.pathname + url.search + url.hash
          );
          setCurrentHash(url.hash);
          scrollToAnchor(url.hash, "smooth");
          return;
        }

        // Handle navigation to different pages
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

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

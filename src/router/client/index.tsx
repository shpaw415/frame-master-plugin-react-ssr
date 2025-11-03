import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { DevProvider } from "../../client/dev";
import { StackLayouts, layoutGetter } from "../../router/layout";
import {
  CurrentRouteContext,
  type currentRouteType,
} from "../../hooks/contexts";
import { useRequest } from "../../hooks";
import type { reactSSRPluginContext } from "../../..";
import { createRouteMatcher } from "./route-matcher";

type RouterHostParams = {
  /** only keept for the first page load then disposed */
  children: JSX.Element;
  /**
   * will be keept on any page change can access the useRoute & useRouteEffect hook
   *
   * */
  ChildrenWrapper?: (props: { children: JSX.Element }) => JSX.Element;
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
export function RouterHost({
  children,
  ChildrenWrapper = ({ children }) => children,
}: RouterHostParams) {
  const request = useRequest();
  const routeMatcher = useMemo(
    () =>
      createRouteMatcher(
        request
          ? []
          : globalThis.__ROUTES__.filter((r) => !r.endsWith("/layout"))
      ),
    []
  );
  const [route, setRoute] = useState<currentRouteType>(
    request
      ? {
          pathname: request.URL.pathname,
          searchParams: request.URL.searchParams,
          params:
            request.getContext<reactSSRPluginContext>()
              .__REACT_SSR_PLUGIN_PARAMS__,
        }
      : {
          pathname: window.location.pathname,
          searchParams: window.location.search
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams(),
          params: routeMatcher(window.location.pathname)?.params || {},
        }
  );
  const [currentPageElement, setCurrentPageElement] =
    useState<JSX.Element>(children);
  const [isInitialRoute, setIsInitialRoute] = useState(true);
  const [routeVersion, setRouteVersion] = useState(0);
  const [currentHash, setCurrentHash] = useState(
    request ? "" : window.location.hash
  );
  const [navigationError, setNavigationError] = useState<Error | null>(null);

  // Use ref instead of state to avoid re-renders and stale closures
  const navigationTimeoutRef = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);

  const loadRoutePageModule = useCallback(
    async (path: string, hash?: string) => {
      // Prevent concurrent navigations
      if (isNavigatingRef.current) {
        return;
      }
      isNavigatingRef.current = true;

      // Clear any previous error
      setNavigationError(null);

      // Clear any pending scroll timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // Create a new controller for this navigation
      const url = new URL(path, window.location.origin);

      if (process.env.NODE_ENV != "production")
        url.searchParams.set("t", new Date().getTime().toString());

      url.searchParams.set("navigate", "true");

      try {
        const _module = (await import(url.toString())) as {
          default: () => JSX.Element;
        };

        const layouts = globalThis.__REACT_SSR_PLUGIN_OPTIONS__.enableLayout
          ? await layoutGetter(path, globalThis.__ROUTES__)
          : [];

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
          isNavigatingRef.current = false;
          return;
        }

        // Handle 404 or module load errors
        console.error(`Failed to load route: ${path}`, error);
        setNavigationError(
          error instanceof Error ? error : new Error("Failed to load page")
        );

        // Set a 404 error page
        setCurrentPageElement(
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Path: {path}</p>
            <button
              onClick={() => {
                window.history.back();
              }}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Go Back
            </button>
          </div>
        );
      } finally {
        isNavigatingRef.current = false;
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

      if (process.env.NODE_ENV !== "production") {
        window.location.href = urlPath;
        return;
      }

      window.history.pushState(null, "", urlPath);

      setRoute({
        pathname,
        searchParams: newSearchParams,
        params: routeMatcher(pathname)?.params || {},
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
      // Don't prevent default or push new state - the browser already changed the URL
      const url = new URL(window.location.href);
      if (process.env.NODE_ENV != "production") location.href = url.toString();
      // Update internal state to match the browser's current URL
      setRoute({
        pathname: url.pathname,
        searchParams: url.searchParams,
        params: routeMatcher(url.pathname)?.params || {},
      });
      setCurrentHash(url.hash);
      setIsInitialRoute(false);
      setRouteVersion((c) => c + 1);

      // Load the page module for the new pathname
      loadRoutePageModule(url.pathname, url.hash);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadRoutePageModule]);

  const navigateToAnchor = useCallback(
    (anchorId: string, behavior: ScrollBehavior = "smooth") => {
      // Ensure anchorId starts with #
      const hash = anchorId.startsWith("#") ? anchorId : `#${anchorId}`;

      // Update state and history
      const currentUrl = window.location.pathname + window.location.search;
      window.history.pushState(null, "", currentUrl + hash);
      setCurrentHash(hash);
      setRouteVersion((c) => c + 1);

      // Scroll to the anchor
      scrollToAnchor(hash, behavior);
    },
    []
  );

  const RouteContextMemo = useMemo(() => {
    return {
      navigate: routeSetter,
      reload: reloadRoute,
      isInitial: isInitialRoute,
      version: routeVersion,
      hash: currentHash,
      navigateToAnchor,
      ...route,
    };
  }, [
    route.pathname,
    searchParamsString,
    routeSetter,
    reloadRoute,
    isInitialRoute,
    routeVersion,
    currentHash,
    navigateToAnchor,
  ]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (process.env.NODE_ENV !== "production") return;

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
          navigateToAnchor(url.hash);
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
  }, [RouteContextMemo.navigate, navigateToAnchor]);

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
        <ChildrenWrapper>{currentPageElement}</ChildrenWrapper>
      </DevProvider>
    </CurrentRouteContext.Provider>
  );
}

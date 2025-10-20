import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import { join, routeGetter } from "@/utils";
import { DevProvider } from "@/client/dev";
import { getRelatedLayoutPaths, importLayouts } from "../utils";
import { useRequest } from "@/hooks";

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
      join("src", "pages", path, "index.js") +
      (process.env.NODE_ENV === "development"
        ? `?${searchParams.toString()}`
        : "");
    const _module = (await import(url.startsWith("/") ? url : "/" + url)) as {
      default: () => JSX.Element;
    };
    setCurrentPageElement(
      <LayoutStack
        layouts={(await layoutGetter(path, routeGetter(request))).map(
          (_module) => _module.default
        )}
      >
        <_module.default />
      </LayoutStack>
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

export function layoutGetter(currentPath: string, layoutsList: Array<string>) {
  const related = getRelatedLayoutPaths(currentPath, layoutsList);
  return importLayouts(related);
}

type LayoutElementFunction = (props: { children: JSX.Element }) => JSX.Element;

type LayoutStackProps = {
  children: JSX.Element;
  layouts: Array<LayoutElementFunction>;
};

export function LayoutStack({ children, layouts }: LayoutStackProps) {
  return layouts.reduceRight((prev, LayoutComponent) => {
    return <LayoutComponent>{prev}</LayoutComponent>;
  }, children);
}

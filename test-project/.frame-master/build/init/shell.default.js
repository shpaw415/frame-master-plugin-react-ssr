import {
  StackLayouts,
  join,
  layoutGetter,
  require_jsx_dev_runtime,
  require_react,
  routeGetter
} from "./../chunk-v6vz8s84.js";
import {
  __toESM
} from "./../chunk-r8a4e87j.js";

// src/router/client/index.tsx
var import_react5 = __toESM(require_react(), 1);

// src/hooks/contexts.ts
var import_react = __toESM(require_react(), 1);
var CurrentRouteContext = import_react.createContext(null);
var RequestContext = import_react.createContext(null);
var ServerSidePropsContext = import_react.createContext(undefined);

// src/hooks/index.ts
var import_react2 = __toESM(require_react(), 1);
function useRequest() {
  return import_react2.useContext(RequestContext);
}
function useRoute() {
  return import_react2.useContext(CurrentRouteContext);
}
function useRouteEffect(onRouteChange) {
  const route = useRoute();
  import_react2.useEffect(() => {
    if (route.isInitial)
      return;
    return onRouteChange();
  }, [route.version]);
}

// src/client/dev.tsx
var import_react3 = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var DevContext = import_react3.createContext(null);
function DevProvider({ children }) {
  console.log("[DevProvider] Render");
  const router = useRoute();
  const ws = import_react3.useRef(null);
  const routerRef = import_react3.useRef(router);
  import_react3.useEffect(() => {
    routerRef.current = router;
  }, [router]);
  import_react3.useEffect(() => {
    if (false)
      ;
    ws.current ??= new WebSocket(`${location.protocol == "http:" ? "ws" : "wss"}://${location.host}/hmr`);
    const eventHandler = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "reload") {
        console.log("[HMR] Reloading page...");
        location.reload();
      }
      if (data.type === "update") {
        console.log("[HMR] Updating route:", routerRef.current.pathname);
        routerRef.current.reload();
      }
    };
    ws.current.addEventListener("message", eventHandler);
    return () => {
      ws.current?.removeEventListener("message", eventHandler);
    };
  }, []);
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DevContext.Provider, {
    value: { ws: ws.current },
    children
  }, undefined, false, undefined, this);
}

// src/hooks/providers.tsx
var import_react4 = __toESM(require_react(), 1);
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
function RequestProvider({
  request,
  children
}) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(RequestContext.Provider, {
    value: request,
    children
  }, undefined, false, undefined, this);
}
function ServerSidePropsProvider({
  children,
  abortController
}) {
  console.log("[ServerSidePropsProvider] Render");
  const request = useRequest();
  const [props, setProps] = import_react4.useState(request ? request.getContext().__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__ : globalThis.__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__);
  const route = useRoute();
  console.log("[ServerSidePropsProvider] route.version:", route.version);
  useRouteEffect(() => {
    console.log("[ServerSidePropsProvider] useRouteEffect triggered");
    setProps(null);
    fetchServerSideProps(route.pathname, abortController).then(setProps);
  });
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ServerSidePropsContext.Provider, {
    value: props,
    children
  }, undefined, false, undefined, this);
}
function fetchServerSideProps(path, abortController) {
  return fetch(path, {
    headers: {
      "x-server-side-props": "true"
    },
    signal: abortController.signal
  }).catch((res) => {}).then((res) => res ? res.json() : null);
}

// src/router/client/index.tsx
var jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
function RouterHost({ initialPath, children }) {
  console.log("[RouterHost] Render");
  const [route, setRoute] = import_react5.useState(initialPath);
  const [currentPageElement, setCurrentPageElement] = import_react5.useState(children);
  const [isInitialRoute, setIsInitialRoute] = import_react5.useState(true);
  const [routeVersion, setRouteVersion] = import_react5.useState(0);
  const renderCountRef = import_react5.useRef(0);
  renderCountRef.current++;
  console.log("[RouterHost] Render count:", renderCountRef.current);
  const abortControllerRef = import_react5.useRef(new AbortController);
  const request = useRequest();
  const loadRoutePageModule = import_react5.useCallback(async (path) => {
    try {
      abortControllerRef.current.abort("page-change");
    } catch {}
    const newController = new AbortController;
    abortControllerRef.current = newController;
    const searchParams = new URLSearchParams;
    searchParams.set("t", new Date().getTime().toString());
    const url = join(globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir, path, "index.js") + `?${searchParams.toString()}`;
    try {
      const _module = await (url.startsWith("/") ? import(url) : import("/" + url));
      if (newController.signal.aborted) {
        return;
      }
      const layouts = await layoutGetter(path, routeGetter(request), globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir);
      if (newController.signal.aborted) {
        return;
      }
      setCurrentPageElement(/* @__PURE__ */ jsx_dev_runtime3.jsxDEV(StackLayouts, {
        layouts: layouts.map((_module2) => _module2.default),
        children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(_module.default, {}, undefined, false, undefined, this)
      }, undefined, false, undefined, this));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (newController.signal.aborted) {
        return;
      }
      throw error;
    }
  }, [request]);
  const routeSetter = import_react5.useCallback((to, searchParams) => {
    const newSearchParams = new URLSearchParams(searchParams);
    const urlPath = newSearchParams.toString() ? `${to}?${newSearchParams.toString()}` : to;
    window.history.pushState(null, "", urlPath);
    setRoute({
      pathname: to,
      searchParams: newSearchParams
    });
    setIsInitialRoute(false);
    setRouteVersion((c) => c + 1);
    loadRoutePageModule(to);
  }, [loadRoutePageModule]);
  const routePathnameRef = import_react5.useRef(route.pathname);
  const searchParamsString = import_react5.useMemo(() => route.searchParams.toString(), [route.searchParams]);
  import_react5.useEffect(() => {
    routePathnameRef.current = route.pathname;
  }, [route.pathname]);
  const reloadRoute = import_react5.useCallback(() => {
    const currentPath = routePathnameRef.current.startsWith("/") ? routePathnameRef.current : "/" + routePathnameRef.current;
    loadRoutePageModule(currentPath);
    setIsInitialRoute(false);
    setRouteVersion((c) => c + 1);
  }, [loadRoutePageModule]);
  import_react5.useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      routeSetter(url.pathname, url.searchParams);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadRoutePageModule, routeSetter]);
  const RouteContextMemo = import_react5.useMemo(() => {
    console.log("[RouterHost] Creating new RouteContextMemo", {
      pathname: route.pathname,
      searchParams: searchParamsString,
      version: routeVersion
    });
    return {
      pathname: route.pathname,
      searchParams: route.searchParams,
      navigate: routeSetter,
      reload: reloadRoute,
      isInitial: isInitialRoute,
      version: routeVersion
    };
  }, [
    route.pathname,
    searchParamsString,
    routeSetter,
    reloadRoute,
    isInitialRoute,
    routeVersion
  ]);
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(CurrentRouteContext.Provider, {
    value: RouteContextMemo,
    children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(DevProvider, {
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ServerSidePropsProvider, {
        abortController: abortControllerRef.current,
        children: currentPageElement
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/Shell.tsx
var import_react6 = __toESM(require_react(), 1);
var jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
function Shell({ children, request }) {
  const initialPathname = import_react6.useMemo(() => request ? request.URL.pathname : window.location.pathname, []);
  const initialSearchParams = import_react6.useMemo(() => {
    const params = request ? request.URL.searchParams : window.location.search ? new URLSearchParams(window.location.search) : new URLSearchParams;
    return params;
  }, []);
  return /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(RequestProvider, {
    request,
    children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(RouterHost, {
      initialPath: {
        pathname: initialPathname,
        searchParams: initialSearchParams
      },
      children
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// init/shell.default.tsx
var jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
function Shell2({
  children,
  request
}) {
  return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("html", {
    id: "root",
    children: [
      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("head", {
        children: [
          /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("meta", {
            charSet: "UTF-8"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("meta", {
            name: "viewport",
            content: "width=device-width, initial-scale=1.0"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("title", {
            children: "Frame Master React SSR"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("body", {
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Shell, {
          request,
          children
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
export {
  Shell2 as default
};

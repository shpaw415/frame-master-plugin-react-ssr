import type { FrameMasterPlugin } from "frame-master/plugin/types";
import type { masterRequest } from "frame-master/server/request";
import type { JSX } from "react";
import { join } from "path";
import PackageJson from "./package.json";
import { renderToReadableStream } from "react-dom/server";
import { ReactSSRBuilder } from "./src/build";
import type { Build_Plugins } from "./src/build/types";
import { pageToJSXElement } from "./src/router/server/render";
import Router from "./src/router/server";
import type { RouteMatch } from "./src/router/client/route-matcher";
import { builder } from "frame-master/build";

export const PATH_TO_REACT_SSR_PLUGIN = import.meta.dir;

export const PATH_TO_REACT_SSR_PLUGIN_DEFAULT_SHELL_FILE = join(
  PATH_TO_REACT_SSR_PLUGIN,
  "init",
  "shell.default.tsx"
);
export const PATH_TO_REACT_SSR_PLUGIN_DEFAULT_CLIENT_WRAPPER_FILE = join(
  PATH_TO_REACT_SSR_PLUGIN,
  "init",
  "client-wrapper.tsx"
) as `<react-ssr-plugin>/init/client-wrapper.tsx`;

const PATH_TO_HYDRATE = {
  server: join(PATH_TO_REACT_SSR_PLUGIN, "init", "hydrate.ts"),
  client:
    "/" + ["node_modules", PackageJson.name, "init", "hydrate.js"].join("/"),
};

export type ReactSSRPluginOptions = {
  /** Enable server-side rendering in future release */
  // enableSSR: boolean;
  /** Enable streaming responses in future release */
  // enableStreaming: boolean;
  /** Path to the pages directory **default: "src/pages"** */
  pathToPagesDir?: string;
  /** Path to the build output directory **default: ".frame-master/build"** */
  pathToBuildDir?: string;
  /** Path to the shell file **default: "frame-master-plugin-react-ssr/init/shell.default.tsx"** */
  pathToShellFile?: string;
  /** Path to the ClientWrapper **default: "frame-master-plugin-react-ssr/init/client-wrapper.tsx"** */
  pathToClientWrapper?: string;
  /** Enable debug logs **default: false** */
  debug?: boolean;
  /** Config to apply to the build step */
  buildConfig?: Build_Plugins[];
  /** plugin priority for fireing order */
  priority?: number;
  /** Use layout feature **default: `true`** */
  enableLayout?: boolean;
};

const DEFAULT_CONFIG: ReactSSRPluginOptions = {
  pathToPagesDir: "src/pages",
  pathToBuildDir: ".frame-master/build",
  pathToShellFile: PATH_TO_REACT_SSR_PLUGIN_DEFAULT_SHELL_FILE,
  pathToClientWrapper: PATH_TO_REACT_SSR_PLUGIN_DEFAULT_CLIENT_WRAPPER_FILE,
  debug: false,
  buildConfig: [],
  priority: 10,
  enableLayout: true,
};

declare global {
  /**
   * An array of all route paths in the application.
   *
   * including page-route and layout-route paths.
   */
  var __ROUTES__: Array<string>;
  var __REACT_SSR_PLUGIN_OPTIONS__: Required<ReactSSRPluginOptions>;
  var __HMR_WEBSOCKET_CLIENTS__: Bun.ServerWebSocket<undefined>[];
  var __REACT_SSR_PLUGIN_SHELL_COMPONENT__: (props: {
    children: JSX.Element;
  }) => JSX.Element;
  var __REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__: (props: {
    children: JSX.Element;
  }) => JSX.Element;
  var __REACT_SSR_PLUGIN_SERVER_ROUTER__: Router | undefined;
  var __REACT_SSR_PLUGIN_SERVER_BUILDER__: ReactSSRBuilder | undefined;
  var __REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__: string | null;
}

globalThis.__HMR_WEBSOCKET_CLIENTS__ ??= [];

export type reactSSRPluginContext = {
  __ROUTES__: Array<string>;
  __REACT_SSR_PLUGIN_OPTIONS__: Required<ReactSSRPluginOptions>;
  __REACT_SSR_PLUGIN_PARAMS__: RouteMatch["params"];
};

const WrapFilePathWithDevSuffix = (filePath: string) => {
  return process.env.NODE_ENV != "production"
    ? `${filePath}?${Date.now()}`
    : filePath;
};

function formatParams(params: Record<string, string>): RouteMatch["params"] {
  return Object.assign(
    {},
    ...Object.entries(params).map(([key, value]) =>
      value.includes("/") ? { [key]: value.split("/") } : { [key]: value }
    )
  );
}

/**
 * this plugin adds React server-side rendering capabilities to Frame Master.
 */
function createPlugin(options: ReactSSRPluginOptions): FrameMasterPlugin {
  const config = { ...DEFAULT_CONFIG, ...options };

  const { buildConfig, ...toBePublic } =
    config as Required<ReactSSRPluginOptions>;

  const serveHTML = async (match: Bun.MatchedRoute, request: masterRequest) => {
    return renderToReadableStream(
      pageToJSXElement({
        ClientWrapper: globalThis.__REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__,
        Shell: globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__,
        Page: {
          page: await import(WrapFilePathWithDevSuffix(match.filePath)),
          layouts: await Promise.all(
            globalThis
              .__REACT_SSR_PLUGIN_SERVER_ROUTER__!.getRelatedLayouts(
                match.pathname
              )
              .map(
                (layoutMatch) =>
                  import(WrapFilePathWithDevSuffix(layoutMatch.filePath))
              )
          ),
        },
        request: request,
      }),
      {
        onError(error) {
          console.error(error);
        },
        bootstrapModules: [PATH_TO_HYDRATE.client],
      }
    );
  };

  const getDevRoutesEntryPoints = () => {
    if (
      !globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__ ||
      !globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__
    )
      return undefined;
    const page =
      globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__.fileSystemRouterServer
        .routes[globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__] || null;
    if (!page) {
      error(
        "Page not found for dev route: " +
          globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__
      );
      return undefined;
    }
    const layouts =
      globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__?.getRelatedLayouts(
        globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__
      ) ?? [];
    return [...layouts.map((match) => match.filePath), page];
  };

  const createBuildConfig: (routes?: string[]) => Partial<Bun.BuildConfig> = (
    routes?: string[]
  ) =>
    ({
      outdir: config.pathToBuildDir!,
      splitting: true,
      entrypoints: [
        PATH_TO_HYDRATE.server,
        config.pathToClientWrapper!,
        ...(routes
          ? routes
          : Array.from(
              new Bun.Glob("**/*.{tsx,jsx}").scanSync({
                cwd: config.pathToPagesDir!,
                absolute: true,
                onlyFiles: true,
              })
            )),
      ],
      plugins: [
        globalThis.__REACT_SSR_PLUGIN_SERVER_BUILDER__!.defaultPlugins(),
      ],
    } satisfies Bun.BuildConfig);

  const cwd = process.cwd();
  let outputs: Bun.BuildOutput | null = null;
  const serveFromBuild = (request: Request) => {
    const pathname = new URL(request.url).pathname;
    const searchPath = join(cwd, config.pathToBuildDir!, pathname);
    return outputs?.outputs
      .find((output) => output.path === searchPath)
      ?.stream();
  };

  return {
    name: "frame-master-plugin-react-ssr",
    version: PackageJson.version,
    priority: config.priority,
    requirement: {
      frameMasterVersion: "^2.0.1",
    },
    build: {
      ...(process.env.NODE_ENV === "production"
        ? {
            buildConfig: () => createBuildConfig(),
            afterBuild(_conf, _outputs) {
              outputs = _outputs;
              globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__?.createClientFileSystemRouter();
              globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__?.reset();
            },
          }
        : {
            buildConfig: () => createBuildConfig(getDevRoutesEntryPoints()),
            afterBuild(conf, _outputs) {
              outputs = _outputs;
              globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__?.createClientFileSystemRouter();
              globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__?.reset();
              HMRBroadcast("update");
            },
          }),
    },
    websocket: {
      onOpen(ws) {
        log("[HMR] Client connected for HMR");
        globalThis.__HMR_WEBSOCKET_CLIENTS__.push(ws);
      },
      onClose(ws) {
        log("[HMR] Client disconnected from HMR");
        globalThis.__HMR_WEBSOCKET_CLIENTS__ =
          globalThis.__HMR_WEBSOCKET_CLIENTS__.filter(
            (client) => client !== ws
          );
      },
      onMessage(ws, message) {
        log("[HMR] Message from client:", message);
      },
    },
    serverConfig: {
      routes: {
        ...(process.env.NODE_ENV != "production"
          ? {
              "/hmr": (_req, server) =>
                server.upgrade(_req)
                  ? new Response("Welcome!", { status: 101 })
                  : new Response("Upgrade failed", { status: 500 }),

              "/__react_ssr_plugin_dev_route__/:pathname": async (req) => {
                const { pathname } = req.params as { pathname: string };
                if (setDevRouteByPathname(pathname)) {
                  await builder?.build();
                  log(
                    `[Dev Mode] Serving path: ${globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__}`
                  );
                  return new Response("Dev route set", { status: 200 });
                } else {
                  return new Response("Dev route unchanged", { status: 204 });
                }
              },
            }
          : {}),
      },
    },
    router: {
      async before_request(req) {
        if (req.isAskingHTML) {
          req.setGlobalValues({
            __ROUTES__: globalThis.__ROUTES__,
            __REACT_SSR_PLUGIN_OPTIONS__:
              toBePublic as Required<ReactSSRPluginOptions>,
          });
        }
        req.setContext<reactSSRPluginContext>({
          __ROUTES__: globalThis.__ROUTES__,
          __REACT_SSR_PLUGIN_OPTIONS__:
            config as Required<ReactSSRPluginOptions>,
          __REACT_SSR_PLUGIN_PARAMS__: {},
        });
      },
      async request(req) {
        let jsPage: Bun.MatchedRoute | null = null;
        if (req.isResponseSetted()) return;
        const res = serveFromBuild(req.request);
        if (res)
          return req
            .setResponse(res, {
              headers: { "Content-Type": "application/javascript" },
            })
            .preventGlobalValuesInjection()
            .preventRewrite()
            .sendNow();

        if (req.isAskingHTML) {
          const pageMatch =
            globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__!.matchServer(
              req.request
            );
          if (!pageMatch) return;
          req.setContext({
            __REACT_SSR_PLUGIN_PARAMS__: formatParams(pageMatch.params),
          });
          const res = serveHTML(pageMatch, req);
          if (!res) return;
          req.setResponse(await res, {
            headers: { "Content-Type": "text/html" },
          });
        } else if (
          (jsPage = globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__!.matchClient(
            req.request
          ))
        ) {
          req.setResponse(Bun.file(jsPage.filePath).stream(), {
            headers: { "Content-Type": "application/javascript" },
          });
        }
      },
    },
    serverStart: {
      async main() {
        // Load the shell component
        globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__ = (
          await import(join(cwd, config.pathToShellFile as string))
        ).default;
        globalThis.__REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__ = (
          await import(join(cwd, config.pathToClientWrapper as string))
        ).default;

        if (!globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__)
          globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__ ??=
            await Router.createRouter({
              pageDir: config.pathToPagesDir!,
              buildDir: config.pathToBuildDir!,
            });

        globalThis.__REACT_SSR_PLUGIN_SERVER_BUILDER__ ??=
          ReactSSRBuilder.createBuilder({
            plugins: [
              ...(config.buildConfig as Build_Plugins[]),
            ] as Build_Plugins[],
            buildDir: config.pathToBuildDir!,
            srcDir: config.pathToPagesDir!,
            builder: builder!,
          });
        if (!builder?.isBuilding()) await builder?.build();

        // Populate the global __REACT_SSR_PLUGIN_OPTIONS__ variable
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__ =
          config as Required<ReactSSRPluginOptions>;

        globalThis.__ROUTES__ = Object.keys(
          globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__.fileSystemRouterServer
            .routes
        );

        globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__.createClientFileSystemRouter();
        log({
          clientRouter:
            globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__.fileSystemRouterClient
              .routes,
          serverRouter:
            globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__.fileSystemRouterServer
              .routes,
        });
      },
    },
    fileSystemWatchDir: [config.pathToPagesDir!],
    onFileSystemChange: async () => {
      globalThis.__ROUTES__ = Object.keys(
        globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__!.fileSystemRouterServer
          .routes
      );
      if (builder?.isBuilding()) return;
      await builder?.build();
    },
  } satisfies FrameMasterPlugin;
}

/** Set the Devroute return true if it's a new route and false otherwise */
function setDevRouteByPathname(pathname: string) {
  const router = globalThis.__REACT_SSR_PLUGIN_SERVER_ROUTER__;
  if (!router) throw new Error("Router not initialized");

  const matchClient = router.fileSystemRouterServer.match(pathname);
  if (!matchClient) return false;
  globalThis.__REACT_SSR_PLUGIN_SERVER_DEV_ROUTE__ = pathname;
  return true;
}

function log(...data: any[]) {
  if (globalThis.__REACT_SSR_PLUGIN_OPTIONS__.debug) {
    console.log("[ReactSSR Plugin]:", ...data);
  }
}
function error(...data: any[]) {
  if (globalThis.__REACT_SSR_PLUGIN_OPTIONS__.debug) {
    console.error("[ReactSSR Plugin][Error]:", ...data);
  }
}

function HMRBroadcast(message: "reload" | "update") {
  globalThis.__HMR_WEBSOCKET_CLIENTS__.forEach((client) => {
    client.send(JSON.stringify({ type: message }));
  });
}

export default createPlugin;

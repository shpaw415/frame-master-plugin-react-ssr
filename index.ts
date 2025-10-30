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

export const PATH_TO_REACT_SSR_PLUGIN = join(
  "node_modules",
  PackageJson.name
) as `node_modules/<react-plugin-name>`;

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
}

globalThis.__HMR_WEBSOCKET_CLIENTS__ ??= [];

export type reactSSRPluginContext = {
  __ROUTES__: Array<string>;
  __REACT_SSR_PLUGIN_OPTIONS__: Required<ReactSSRPluginOptions>;
  __REACT_SSR_PLUGIN_PARAMS__: RouteMatch["params"];
};

let router: Router | null = null;
let reactSSRBuilder: ReactSSRBuilder | null = null;

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
            router!
              .getRelatedLayouts(match.pathname)
              .map(
                (layoutMatch) =>
                  import(WrapFilePathWithDevSuffix(layoutMatch.filePath))
              )
          ),
        },
        request: request,
      }),
      {
        onError(err) {
          console.error(err);
        },
        bootstrapModules: [PATH_TO_HYDRATE.client],
      }
    );
  };

  const createBuildConfig = () =>
    ({
      outdir: config.pathToBuildDir!,
      splitting: true,
      entrypoints: [
        PATH_TO_HYDRATE.server,
        config.pathToClientWrapper!,
        ...Object.values(router?.fileSystemRouterServer.routes!),
        "react",
        "react/jsx-runtime",
        "react-dom",
        "node_modules/react/jsx-dev-runtime",
      ],
      plugins: [reactSSRBuilder!.defaultPlugins()],
    } satisfies Bun.BuildConfig);

  let currentDevPath: string | null = null;

  return {
    name: "frame-master-plugin-react-ssr",
    version: PackageJson.version,
    priority: config.priority,
    build: {
      buildConfig:
        process.env.NODE_ENV == "production"
          ? createBuildConfig()
          : createBuildConfig,
      ...(process.env.NODE_ENV != "production" && {
        afterBuild() {
          router!.createClientFileSystemRouter();
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

        // In dev mode, track the current path being requested
        const matchClient = router?.fileSystemRouterClient.match(req.request);
        if (process.env.NODE_ENV != "production" && matchClient) {
          if (matchClient.pathname == currentDevPath) return;
          currentDevPath = req.URL.pathname;
          log(`[Dev Mode] Serving path: ${currentDevPath}`);
        }
      },
      async request(req) {
        let jsPage: Bun.MatchedRoute | null = null;
        if (req.isResponseSetted()) return;

        const res = serveFromBuild(req.URL.pathname, reactSSRBuilder!);
        if (res)
          return req
            .setResponse(res, {
              headers: { "Content-Type": "application/javascript" },
            })
            .preventGlobalValuesInjection()
            .preventRewrite()
            .sendNow();

        if (req.isAskingHTML) {
          const pageMatch = router!.matchServer(req.request);
          if (!pageMatch) return;
          req.setContext({
            __REACT_SSR_PLUGIN_PARAMS__: formatParams(pageMatch.params),
          });
          const res = serveHTML(pageMatch, req);
          if (!res) return;
          req.setResponse(await res, {
            headers: { "Content-Type": "text/html" },
          });
        } else if ((jsPage = router!.matchClient(req.request))) {
          req.setResponse(Bun.file(jsPage.filePath).stream(), {
            headers: { "Content-Type": "application/javascript" },
          });
        }
      },
    },
    serverStart: {
      async main() {
        if (!router)
          router = await Router.createRouter({
            pageDir: config.pathToPagesDir!,
            buildDir: config.pathToBuildDir!,
          });

        reactSSRBuilder = ReactSSRBuilder.createBuilder({
          plugins: [
            ...(config.buildConfig as Build_Plugins[]),
          ] as Build_Plugins[],
          buildDir: config.pathToBuildDir!,
          srcDir: config.pathToPagesDir!,
          builder: builder!,
        });

        // Populate the global __REACT_SSR_PLUGIN_OPTIONS__ variable
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__ =
          config as Required<ReactSSRPluginOptions>;

        globalThis.__ROUTES__ = Object.keys(
          router.fileSystemRouterServer.routes
        );

        // Load the shell component
        globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__ = (
          await import(join(process.cwd(), config.pathToShellFile as string))
        ).default;
        globalThis.__REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__ = (
          await import(
            join(process.cwd(), config.pathToClientWrapper as string)
          )
        ).default;
        await builder?.build();
        router.createClientFileSystemRouter();
        log({
          clientRouter: router.fileSystemRouterClient.routes,
          serverRouter: router.fileSystemRouterServer.routes,
        });
      },
    },
    fileSystemWatchDir: [config.pathToPagesDir!],
    onFileSystemChange: async () => {
      router?.reset();
      globalThis.__ROUTES__ = Object.keys(
        router!.fileSystemRouterServer.routes
      );
      router?.reset();
      builder?.build();
    },
  } satisfies FrameMasterPlugin;
}

function serveFromBuild(pathname: string, reactSSRbuilder: ReactSSRBuilder) {
  return (
    reactSSRbuilder
      .getFileFromPath(join(reactSSRbuilder.buildDir, pathname))
      ?.stream() || null
  );
}

function log(...data: any[]) {
  if (globalThis.__REACT_SSR_PLUGIN_OPTIONS__.debug) {
    console.log("[ReactSSR Plugin]:", ...data);
  }
}

function HMRBroadcast(message: "reload" | "update") {
  globalThis.__HMR_WEBSOCKET_CLIENTS__.forEach((client) => {
    client.send(JSON.stringify({ type: message }));
  });
}

export default createPlugin;

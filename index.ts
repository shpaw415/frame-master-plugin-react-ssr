import Router from "@/router/server";
import type { FrameMasterPlugin } from "frame-master/plugin/types";
import type { masterRequest } from "frame-master/server/request";
import type { JSX } from "react";
import { join, parse } from "path";
import PackageJson from "./package.json";
import { renderToReadableStream } from "react-dom/server";
import { StackLayouts } from "@/router/layout";
import { Builder } from "@/build";
import type { Build_Plugins } from "./src/build/types";
import FrameMasterConfig from "frame-master/config";

export const PATH_TO_REACT_SSR_PLUGIN = join(
  process.cwd(),
  "node_modules",
  PackageJson.name
) as `<cwd>/node_modules/${string}`;

export const PATH_TO_REACT_SSR_PLUGIN_DEFAULT_SHELL_FILE = join(
  PATH_TO_REACT_SSR_PLUGIN,
  "init",
  "shell.default.tsx"
);

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
  /** Enable debug logs **default: false** */
  debug?: boolean;
  buildConfig?: Build_Plugins[];
  /** WebSocket Dev Server for HMR reloading client side */
  devServerPort: number;
};

const DEFAULT_CONFIG: ReactSSRPluginOptions = {
  pathToPagesDir: "src/pages",
  pathToBuildDir: ".frame-master/build",
  pathToShellFile: PATH_TO_REACT_SSR_PLUGIN_DEFAULT_SHELL_FILE,
  debug: false,
  buildConfig: [],
  devServerPort: 3001,
};

declare global {
  /**
   * An array of all route paths in the application.
   *
   * including page-route and layout-route paths.
   */
  var __ROUTES__: Array<string>;
  var __REACT_SSR_PLUGIN_OPTIONS__: Required<ReactSSRPluginOptions>;
  var __HMR_WEBSOCKET__: Bun.Server<undefined>;
  var __HMR_WEBSOCKET_CLIENTS__: Bun.ServerWebSocket<undefined>[];
  var __REACT_SSR_PLUGIN_SHELL_COMPONENT__: (props: {
    children: JSX.Element;
    request: masterRequest | null;
  }) => JSX.Element;
}

globalThis.__HMR_WEBSOCKET_CLIENTS__ ??= [];

let router: Router | null = null;

export type reactSSRPluginContext = {
  __ROUTES__: Array<string>;
  __REACT_SSR_PLUGIN_OPTIONS__: Required<ReactSSRPluginOptions>;
};

/**
 * this plugin adds React server-side rendering capabilities to Frame Master.
 */
function createPlugin(options: ReactSSRPluginOptions): FrameMasterPlugin {
  const config = { ...DEFAULT_CONFIG, ...options };

  const builder = new Builder({
    enableLogging: config.debug,
    plugins: [...(config.buildConfig as Build_Plugins[])] as Build_Plugins[],
    buildDir: config.pathToBuildDir!,
  });

  const { buildConfig, pathToShellFile, ...toBePublic } =
    config as Required<ReactSSRPluginOptions>;

  return {
    name: "frame-master-plugin-react-ssr",
    router: {
      before_request(req) {
        if (req.isAskingHTML)
          req.setGlobalValues({
            __ROUTES__: globalThis.__ROUTES__,
            __REACT_SSR_PLUGIN_OPTIONS__:
              toBePublic as Required<ReactSSRPluginOptions>,
          });
        req.setContext<reactSSRPluginContext>({
          __ROUTES__: globalThis.__ROUTES__,
          __REACT_SSR_PLUGIN_OPTIONS__:
            config as Required<ReactSSRPluginOptions>,
        });
      },
      async request(req) {
        if (req.isAskingHTML) {
          const pathname = req.URL.pathname;
          const page = router?.getFromRoutePath(pathname);
          if (!page) return;
          const res = await serveHTML(pathname, req);
          if (!res) return;
          req.setResponse(res, {
            headers: { "Content-Type": "text/html" },
          });
        } else {
          const res = serveFromBuild(req.URL.pathname, builder);
          if (!res) return;
          req.preventGlobalValuesInjection().preventRewrite();
          req.setResponse(res, {
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

        // Populate the global __ROUTES__ variable
        globalThis.__ROUTES__ = Array.from(
          router.routes.keys().map((path) => path.replace(".tsx", ".js"))
        );

        // Populate the global __REACT_SSR_PLUGIN_OPTIONS__ variable
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__ =
          config as Required<ReactSSRPluginOptions>;

        // Load the shell component
        globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__ = (
          await import(config.pathToShellFile as string)
        ).default;

        const routes = router
          .getRoutePaths()
          .map((route) => join(router?.pageDir!, route));

        await builder.build(routes);

        if (process.env.NODE_ENV !== "production") {
          DevServer(config as Required<ReactSSRPluginOptions>);
        }
      },
    },
    fileSystemWatchDir: [config.pathToPagesDir!],
    onFileSystemChange: () => {
      const routes = router!
        .getRoutePaths()
        .map((route) => join(router?.pageDir!, route));

      builder.build(routes).then(() => {
        HMRBroadcast("reload");
      });
    },
  } satisfies FrameMasterPlugin;
}

function serveHTML(pathname: string, request: masterRequest | null) {
  const page = router?.getFromRoutePath(pathname);
  if (!page) {
    return null;
  }

  return renderToReadableStream(
    globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__({
      children: StackLayouts({ children: page.page(), layouts: page.layouts }),
      request,
    }),
    {
      onError(err) {
        console.error(err);
      },
      bootstrapModules: [
        `/node_modules/${PackageJson.name}/src/client/hydrate.js`,
      ],
    }
  );
}

function serveFromBuild(pathname: string, builder: Builder) {
  return builder.getFileFromPath(pathname)?.stream() || null;
}

function log(...data: any[]) {
  if (globalThis.__REACT_SSR_PLUGIN_OPTIONS__.debug) {
    console.log("[ReactSSR Plugin]:", ...data);
  }
}

function HMRBroadcast(message: "reload") {
  globalThis.__HMR_WEBSOCKET_CLIENTS__.forEach((client) => {
    client.send(JSON.stringify({ type: message }));
  });
}

function DevServer(config: Required<ReactSSRPluginOptions>) {
  globalThis.__HMR_WEBSOCKET__ ??= Bun.serve({
    port: config.devServerPort,
    websocket: {
      open(ws) {
        log("[HMR] Client connected for HMR");
        globalThis.__HMR_WEBSOCKET_CLIENTS__.push(ws);
      },
      close(ws) {
        log("[HMR] Client disconnected from HMR");
        globalThis.__HMR_WEBSOCKET_CLIENTS__ =
          globalThis.__HMR_WEBSOCKET_CLIENTS__.filter(
            (client) => client !== ws
          );
      },
      message(ws, message) {
        log("[HMR] Message from client:", message);
      },
    },
    fetch(request, server) {
      const url = new URL(request.url);

      if (url.pathname === "/hmr") {
        return server.upgrade(request, {})
          ? new Response("welcome!")
          : new Response("Failed to upgrade", { status: 400 });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
  return globalThis.__HMR_WEBSOCKET__;
}

export default createPlugin;

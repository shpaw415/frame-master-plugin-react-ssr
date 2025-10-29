import Router from "./src/router/server";
import type { FrameMasterPlugin } from "frame-master/plugin/types";
import type { masterRequest } from "frame-master/server/request";
import type { JSX } from "react";
import { join } from "path";
import PackageJson from "./package.json";
import { renderToReadableStream } from "react-dom/server";
import type { ReactSSRBuilder } from "./src/build";
import type { Build_Plugins } from "./src/build/types";
import {
  getServerSideProps,
  type ServerSidePropsResult,
} from "./src/features/serverSideProps/server";
import { pageToJSXElement } from "./src/router/server/render";

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
  var __REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__: ServerSidePropsResult;
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
  __REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__: ServerSidePropsResult;
};

let router: Router | null = null;
let reactSSRBuilder: ReactSSRBuilder | null = null;

/**
 * this plugin adds React server-side rendering capabilities to Frame Master.
 */
function createPlugin(options: ReactSSRPluginOptions): FrameMasterPlugin {
  const config = { ...DEFAULT_CONFIG, ...options };

  const { buildConfig, ...toBePublic } =
    config as Required<ReactSSRPluginOptions>;

  const serveHTML = (pathname: string, request: masterRequest) => {
    const page = router!.getFromRoutePath(pathname);
    if (!page) {
      return null;
    }
    return renderToReadableStream(
      pageToJSXElement({
        ClientWrapper: globalThis.__REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__,
        Shell: globalThis.__REACT_SSR_PLUGIN_SHELL_COMPONENT__,
        Page: page,
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

  return {
    name: "frame-master-plugin-react-ssr",
    version: PackageJson.version,
    priority: config.priority,
    build: {
      buildConfig: () => ({
        outdir: config.pathToBuildDir!,
        splitting: true,
        entrypoints: [
          PATH_TO_HYDRATE.server,
          config.pathToClientWrapper!,
          ...(router
            ?.getRoutePaths()
            .map((route) => join(router?.pageDir!, route)) || []),
        ],
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
    router: {
      async before_request(req) {
        const SSP = await getServerSideProps(req, router!);
        if (req.isAskingHTML) {
          req.setGlobalValues({
            __ROUTES__: globalThis.__ROUTES__,
            __REACT_SSR_PLUGIN_OPTIONS__:
              toBePublic as Required<ReactSSRPluginOptions>,
            __REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__: SSP,
          });
        }
        req.setContext<reactSSRPluginContext>({
          __ROUTES__: globalThis.__ROUTES__,
          __REACT_SSR_PLUGIN_OPTIONS__:
            config as Required<ReactSSRPluginOptions>,
          __REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__: SSP,
        });
      },
      async request(req) {
        if (req.isResponseSetted()) return;
        else if (
          req.URL.pathname == "/hmr" &&
          process.env.NODE_ENV != "production"
        ) {
          req.serverInstance.upgrade(req.request)
            ? req.setResponse("welcome!").sendNow()
            : req.setResponse("Failed to upgrade", { status: 400 }).sendNow();
          return;
        } else if (req.isAskingHTML) {
          const pathname = req.URL.pathname;
          const page = router?.getFromRoutePath(pathname);
          if (!page) return;
          const res = serveHTML(pathname, req);
          if (!res) return;
          req.setResponse(await res, {
            headers: { "Content-Type": "text/html" },
          });
        } else if (req.request.headers.get("x-server-side-props")) {
          req
            .setResponse(
              JSON.stringify(
                req.getContext<reactSSRPluginContext>()
                  .__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__ || null
              )
            )
            .sendNow();
        } else {
          const res = serveFromBuild(req.URL.pathname, reactSSRBuilder!);
          if (!res) return;
          req
            .setResponse(await res, {
              headers: { "Content-Type": "application/javascript" },
            })
            .preventGlobalValuesInjection()
            .preventRewrite()
            .sendNow();
        }
      },
    },
    serverStart: {
      async main() {
        const builder = (await import("frame-master/build")).builder;
        reactSSRBuilder = (
          await import("./src/build")
        ).ReactSSRBuilder.createBuilder({
          plugins: [
            ...(config.buildConfig as Build_Plugins[]),
          ] as Build_Plugins[],
          buildDir: config.pathToBuildDir!,
          srcDir: config.pathToPagesDir!,
        });
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
          await import(join(process.cwd(), config.pathToShellFile as string))
        ).default;
        globalThis.__REACT_SSR_PLUGIN_CLIENT_WRAPPER_COMPONENT__ = (
          await import(
            join(process.cwd(), config.pathToClientWrapper as string)
          )
        ).default;

        await builder.build();
      },
    },
    fileSystemWatchDir: [config.pathToPagesDir!],
    onFileSystemChange: async () => {
      const builder = (await import("frame-master/build")).builder;
      await router?.reload();
      builder.build().then(() => {
        HMRBroadcast("update");
      });
    },
  } satisfies FrameMasterPlugin;
}

async function serveFromBuild(pathname: string, builder: ReactSSRBuilder) {
  return (
    (
      await builder.getFileFromPath(join(builder.buildDir, pathname))
    )?.stream() || null
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

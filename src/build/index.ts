import { join } from "path";
import type { Build_Plugins } from "./types";

type BuildProps = {
  plugins: Build_Plugins[];
  buildDir: string;
  srcDir: string;
};

class ReactSSRBuilder {
  plugins: Build_Plugins[];
  buildDir: string;
  srcDir: string;

  constructor(props: BuildProps) {
    this.plugins = [...props.plugins, ...this.defaultTransformPlugin()];
    this.buildDir = join(process.cwd(), props.buildDir);
    this.srcDir = join(process.cwd(), props.srcDir);
  }

  static createBuilder(props: BuildProps): ReactSSRBuilder {
    const builder = new ReactSSRBuilder(props);
    return builder;
  }

  async getFileFromPath(path: string): Promise<Bun.BuildArtifact | null> {
    const builder = (await import("frame-master/build")).builder;
    const res = builder.outputs?.find((output) => {
      output.path === path;
    });
    return res || null;
  }

  async defaultPlugins(): Promise<Bun.BunPlugin> {
    const self = this;
    const Builder = (await import("frame-master/build")).Builder;
    return {
      name: "frame-master-plugin-react-ssr-builder",
      target: "browser",
      setup(build) {
        build.onLoad(
          {
            filter: Builder.pluginRegexMake({
              path: [self.srcDir],
              ext: ["tsx"],
            }),
          },
          async (args) => {
            const { contents, loader } = await self.jsFileHandler({
              args,
              fileExt: "tsx",
            });
            return { contents, loader: loader || args.loader };
          }
        );
        build.onLoad(
          {
            filter: Builder.pluginRegexMake({
              path: [self.srcDir],
              ext: ["ts"],
            }),
          },
          async (args) => {
            const { contents, loader } = await self.jsFileHandler({
              args,
              fileExt: "ts",
            });
            return { contents, loader: loader || args.loader };
          }
        );
      },
    };
  }

  private defaultTransformPlugin(): BuildProps["plugins"] {
    return [
      {
        partialPluginOverRide: {
          tsx(args, fileContent, fileDirectives) {
            return {
              contents: new Bun.Transpiler({
                exports: {
                  eliminate: ["getServerSideProps"],
                },
                loader: args.loader as "tsx",
                trimUnusedImports: false,
                treeShaking: false,
                autoImportJSX: true,
              }).transformSync(fileContent),
              loader: "js",
            };
          },
        },
      },
    ];
  }

  private async jsFileHandler({
    args,
    fileExt,
  }: {
    args: Bun.OnLoadArgs;
    fileExt: "tsx" | "ts" | "others";
  }): Promise<{ contents: string; loader?: Bun.Loader }> {
    const directiveManager = (await import("frame-master/utils"))
      .directiveManager;

    const Builder = (await import("frame-master/build")).Builder;

    if (await directiveManager.pathIs("server-only", args.path)) {
      return Builder.returnEmptyFile("js", await import(args.path));
    }

    let fileContents = await Bun.file(args.path).text();

    let loaderOverRide: Bun.Loader | undefined = undefined;
    for await (const plugin of this.plugins
      .map((p) => p.partialPluginOverRide)
      .filter((p) => p !== undefined)) {
      const func = plugin[fileExt];
      if (!func) continue;
      try {
        const res = await func(
          { ...args, loader: loaderOverRide || args.loader },
          fileContents,
          directiveManager
        );
        const contents = await (res?.contents as unknown as Promise<string>);
        if (contents) {
          fileContents = contents;
        }
        if (res?.loader) {
          loaderOverRide = res.loader as any;
        }
      } catch (e) {
        throw new Error(
          `Error occurred while processing partialPluginOverride[${fileExt}] with arguments:\n ${JSON.stringify(
            args,
            null,
            2
          )}`,
          {
            cause: e,
          }
        );
      }
    }

    return {
      contents: fileContents,
      loader: loaderOverRide,
    };
  }
}

export { ReactSSRBuilder };

import { join } from "path";
import type { Build_Plugins } from "./types";
import packageJson from "../../package.json";
import { mkdirSync, rmSync } from "fs";
import { directiveManager } from "frame-master/utils";

const DEFAULT_BUILD_OPTIONS: Bun.BuildConfig = {
  minify: process.env.NODE_ENV == "production",
  splitting: true,
  entrypoints: [
    /*
    "react",
    "react-dom",
    join(
      "node_modules",
      "react",
      "cjs",
      "react-jsx-dev-runtime.development.js"
    ),
    join("node_modules", "react", "jsx-dev-runtime.js"),
    */
  ],
  plugins: [],
  define: {},
  external: [],
  loader: {},
  publicPath: "./",
  env: "PUBLIC_*",
};

type BuildProps = {
  plugins: Build_Plugins[];
  enableLogging?: boolean;
  buildDir: string;
  srcDir: string;
};

class Builder {
  plugins: Build_Plugins[];
  isLogEnabled: boolean;
  outputs: Bun.BuildArtifact[] | null = null;
  buildDir: string;
  srcDir: string;

  constructor(props: BuildProps) {
    this.plugins = [...props.plugins, ...this.defaultTransformPlugin()];
    this.isLogEnabled = props.enableLogging ?? true;
    this.buildDir = join(process.cwd(), props.buildDir);
    this.srcDir = join(process.cwd(), props.srcDir);
  }

  static createBuilder(props: BuildProps): Builder {
    const builder = new Builder(props);
    return builder;
  }

  pluginRegexMake({ path, ext }: { path: string[]; ext: string[] }) {
    return new RegExp(
      `^${join(...path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*\\.(${ext.join(
        "|"
      )})$`
    );
  }

  async build(entrypoints: string[]) {
    this.clearBuildDir();
    if (process.env.NODE_ENV != "production") directiveManager.clearPaths();
    const buildConfig = await this.getPluginsOptions();
    this.log("Build Config:", buildConfig);
    buildConfig.entrypoints = [...buildConfig.entrypoints, ...entrypoints];
    buildConfig.plugins = [
      this.defaultPlugins(),
      ...(buildConfig.plugins || []),
    ];

    this.log("🔨 Building with merged configuration:", {
      entrypoints: buildConfig.entrypoints?.length || 0,
      plugins: buildConfig.plugins.length || 0,
      outdir: this.buildDir,
    });

    await Promise.all(this.plugins.map((p) => p.before_build?.()));

    const res = await Bun.build({
      minify: process.env.NODE_ENV == "prduction",
      ...buildConfig,
    });

    await Promise.all(this.plugins.map((p) => p.after_build?.(res)));

    if (res.success) {
      this.outputs = res.outputs;
    } else {
      this.error("Build failed with error:", res);
    }

    return res;
  }

  getFileFromPath(path: string): Bun.BuildArtifact | null {
    if (!this.outputs) return null;
    const file = this.outputs.find(
      (output) => output.path === join(this.buildDir, path)
    );
    return file || null;
  }

  async getPluginsOptions(): Promise<Bun.BuildConfig> {
    const config = { ...DEFAULT_BUILD_OPTIONS, outdir: this.buildDir };
    const options = this.plugins
      .map((p) => p.buildOptions)
      .filter((o) => o !== undefined);

    for await (const option of options) {
      this.mergeConfigSafely(
        config,
        typeof option == "function" ? await option() : option
      );
    }

    return config;
  }

  private defaultPlugins(): Bun.BunPlugin {
    const self = this;

    return {
      name: "frame-master-plugin-react-ssr-builder-defaults",
      target: "browser",
      setup(build) {
        build.onLoad(
          {
            filter: self.pluginRegexMake({
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
            filter: self.pluginRegexMake({
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
    if (await directiveManager.pathIs("server-only", args.path)) {
      return this.returnEmptyFile("js", Object.keys(await import(args.path)));
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

  private returnEmptyFile(loader: Bun.Loader, exports: string[]) {
    const toErrorString = (e: string) =>
      `throw new Error("[ ${e} ] This is server-only component and cannot be used in client-side.")`;
    return {
      contents: exports
        .map((e) => {
          return e == "default"
            ? `export default function _default() { ${toErrorString(
                "default"
              )} };`
            : `export const ${e} = () => { ${toErrorString(e)} }`;
        })
        .join("\n"),
      loader,
    };
  }

  private mergeConfigSafely(
    target: Bun.BuildConfig,
    source: Partial<Bun.BuildConfig>
  ) {
    for (const [key, sourceValue] of Object.entries(source)) {
      const targetValue = target[key as keyof Bun.BuildConfig];

      // Skip if source value is undefined
      if (sourceValue === undefined) continue;

      // If target doesn't have this key, just assign it
      if (targetValue === undefined) {
        (target as any)[key] = sourceValue;
        continue;
      }

      // Special handling for specific config keys
      if (
        key === "entrypoints" &&
        Array.isArray(targetValue) &&
        Array.isArray(sourceValue)
      ) {
        // Merge entrypoints, removing duplicates by path
        const entrySet = new Set([...targetValue, ...sourceValue]);
        (target as any)[key] = Array.from(entrySet);
      } else if (
        key === "plugins" &&
        Array.isArray(targetValue) &&
        Array.isArray(sourceValue)
      ) {
        // Plugins should be concatenated to preserve order and allow multiple instances
        (target as any)[key] = [...targetValue, ...sourceValue];
      } else if (
        key === "external" &&
        Array.isArray(targetValue) &&
        Array.isArray(sourceValue)
      ) {
        // External modules should be deduplicated
        const externalSet = new Set([...targetValue, ...sourceValue]);
        (target as any)[key] = Array.from(externalSet);
      } else if (
        key === "define" &&
        this.isPlainObject(targetValue) &&
        this.isPlainObject(sourceValue)
      ) {
        // Define should merge keys, with source overriding target
        (target as any)[key] = {
          ...(targetValue as Record<string, any>),
          ...(sourceValue as Record<string, any>),
        };
      } else if (
        key === "loader" &&
        this.isPlainObject(targetValue) &&
        this.isPlainObject(sourceValue)
      ) {
        // Loader should merge keys, with source overriding target
        (target as any)[key] = {
          ...(targetValue as Record<string, any>),
          ...(sourceValue as Record<string, any>),
        };
      } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        // Generic array merge - concatenate and deduplicate primitives
        const merged = [...targetValue];
        for (const item of sourceValue) {
          // Only deduplicate primitives, keep all objects
          if (typeof item === "object" || !merged.includes(item)) {
            merged.push(item);
          }
        }
        (target as any)[key] = merged;
      } else if (
        this.isPlainObject(targetValue) &&
        this.isPlainObject(sourceValue)
      ) {
        // Deep merge objects
        (target as any)[key] = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else if (typeof targetValue === typeof sourceValue) {
        // Same type, source overrides target (boolean, string, number)
        this.log(
          `ℹ️  Build config "${key}" overridden: ${targetValue} → ${sourceValue}`
        );
        (target as any)[key] = sourceValue;
      } else {
        // Type mismatch - warn and use source value
        console.warn(
          `⚠️  Build config conflict for key "${key}": ` +
            `Cannot merge ${typeof targetValue} with ${typeof sourceValue}. ` +
            `Using plugin value: ${JSON.stringify(sourceValue)}`
        );
        (target as any)[key] = sourceValue;
      }
    }
    return target;
  }

  private deepMerge(
    target: Record<string, any>,
    source: Record<string, any>
  ): Record<string, any> {
    const result = { ...target };

    for (const [key, sourceValue] of Object.entries(source)) {
      const targetValue = result[key];

      if (sourceValue === undefined) continue;

      if (this.isPlainObject(targetValue) && this.isPlainObject(sourceValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        // For nested arrays, concatenate
        result[key] = [...targetValue, ...sourceValue];
      } else {
        result[key] = sourceValue;
      }
    }

    return result;
  }
  private clearBuildDir() {
    try {
      rmSync(this.buildDir, { recursive: true, force: true });
    } catch (e) {
      this.error(e);
    }
    try {
      mkdirSync(this.buildDir, { recursive: true });
    } catch (e) {
      this.error(e);
    }
  }
  private isPlainObject(value: any): boolean {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp) &&
      Object.prototype.toString.call(value) === "[object Object]"
    );
  }
  private log(...data: any[]) {
    if (!this.isLogEnabled) return;
    console.log("[Frame-Master-plugin-react-ssr Builder]:", ...data);
  }
  private error(...data: any[]) {
    if (!this.isLogEnabled) return;
    console.error("[Frame-Master-plugin-react-ssr Builder]:", ...data);
  }
}

export { Builder };

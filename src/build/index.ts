import { join } from "path";
import type { Build_Plugins } from "./types";
import packageJson from "../../package.json";
import { mkdirSync, rmSync } from "fs";

export const buildDir = join(
  process.cwd(),
  ".frame-master",
  "build"
) as `${string}/.frame-master/build`;

const DEFAULT_BUILD_OPTIONS: Bun.BuildConfig = {
  outdir: buildDir,
  minify: process.env.NODE_ENV == "production",
  splitting: true,
  entrypoints: [
    join("node_modules", packageJson.name, "src", "client", "hydrate.tsx"),
    "react",
    "react-dom",
    join(
      "node_modules",
      "react",
      "cjs",
      "react-jsx-dev-runtime.development.js"
    ),
    join("node_modules", "react", "jsx-dev-runtime.js"),
  ],
  plugins: [],
  define: {},
  external: [],
  loader: {},
  publicPath: "./",
  env: "PUBLIC_*",
};

console.log("Default build options:", DEFAULT_BUILD_OPTIONS);

type BuildProps = {
  plugins: Build_Plugins[];
  enableLogging?: boolean;
};

class Builder {
  plugins: Build_Plugins[];
  isLogEnabled: boolean;

  constructor(props: BuildProps) {
    this.plugins = props.plugins;
    this.isLogEnabled = props.enableLogging ?? true;
  }

  private log(...data: any[]) {
    if (!this.isLogEnabled) return;
    console.log("[Frame-Master-plugin-react-ssr Builder]:", ...data);
  }
  private error(...data: any[]) {
    console.error("[Frame-Master-plugin-react-ssr Builder]:", ...data);
  }

  async build(entrypoints: string[]) {
    this.clearBuildDir();
    const buildConfig = await this.getPluginsOptions();

    buildConfig.entrypoints = [...buildConfig.entrypoints, ...entrypoints];

    this.log("🔨 Building with merged configuration:", {
      entrypoints: buildConfig.entrypoints?.length || 0,
      plugins: buildConfig.plugins?.length || 0,
      outdir: buildConfig.outdir,
    });

    await Promise.all(this.plugins.map((p) => p.before_build?.()));

    const res = await Bun.build(buildConfig);

    await Promise.all(this.plugins.map((p) => p.after_build?.(res)));

    return res;
  }

  async getPluginsOptions(): Promise<Bun.BuildConfig> {
    const config = { ...DEFAULT_BUILD_OPTIONS };
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

      // Handle different merge strategies based on type
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        // Merge arrays by concatenating unique values
        const merged = [...targetValue];
        for (const item of sourceValue) {
          if (!merged.includes(item)) {
            merged.push(item);
          }
        }
        (target as any)[key] = merged;
      } else if (
        this.isPlainObject(targetValue) &&
        this.isPlainObject(sourceValue)
      ) {
        // Merge objects recursively
        (target as any)[key] = {
          ...(targetValue as Record<string, any>),
          ...(sourceValue as Record<string, any>),
        };
      } else if (targetValue !== sourceValue) {
        // Conflict detected - values can't be merged
        console.warn(
          `⚠️  Build config conflict for key "${key}": ` +
            `Cannot merge ${typeof targetValue} with ${typeof sourceValue}. ` +
            `Using plugin value: ${JSON.stringify(sourceValue)}`
        );
        (target as any)[key] = sourceValue;
      }
      // If values are the same, no action needed
    }
  }
  private clearBuildDir() {
    try {
      rmSync(buildDir, { recursive: true, force: true });
    } catch (e) {
      this.error(e);
    }
    try {
      mkdirSync(buildDir, { recursive: true });
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
}

export { Builder };

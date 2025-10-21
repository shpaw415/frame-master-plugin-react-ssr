import type { JSX } from "react";
import { join } from "path";
import { getRelatedLayoutPaths } from "../layout";

type RoutePage = () => JSX.Element;

const AUTHORIZED_ROUTE_NAMES = ["index.tsx", "layout.tsx"];

type RouterProps = {
  pageDir: string;
  buildDir: string;
};

class Router {
  pageDir: string;
  buildDir: string;
  routes = new Map<string, RoutePage>();
  buildRoutes = new Map<string, Bun.BunFile>();
  private cwd = process.cwd();

  constructor(props: RouterProps) {
    this.pageDir = props.pageDir;
    this.buildDir = join(this.cwd, props.buildDir);
  }

  static async createRouter(props: RouterProps): Promise<Router> {
    const router = new Router(props);
    await router._initRoutes();
    await router._initBuildRoutes();
    return router;
  }

  public reload() {
    return Promise.all([this._initRoutes(), this._initBuildRoutes()]);
  }

  public reloadBuildRoutes() {
    return this._initBuildRoutes();
  }

  private async _initRoutes() {
    this.routes.clear();
    const glob = (
      await Array.fromAsync(
        new Bun.Glob("**/**.tsx").scanSync({
          cwd: this.pageDir,
          onlyFiles: true,
        })
      )
    ).filter((file) => {
      return AUTHORIZED_ROUTE_NAMES.includes(file.split("/").pop()!);
    });
    const suffix =
      process.env.NODE_ENV == "production" ? "" : `?t=${new Date().getTime()}`;
    const exports = await Promise.all(
      glob.map(async (file) => {
        const _module = (await import(
          join(this.cwd, this.pageDir, file) + suffix
        )) as {
          default: RoutePage;
        };
        return { path: file, default: _module.default };
      })
    );
    for (const exp of exports) {
      this.registerRoute(exp.path, exp.default);
    }
  }
  fileToRoutePath(file: string) {
    if (file === "index.tsx") return "/";
    if (file === "layout.tsx") return "/";
    return "/" + file.split("/").slice(0, -1).join("/");
  }
  private async _initBuildRoutes() {
    this.buildRoutes.clear();
    const glob = await Array.fromAsync(
      new Bun.Glob("**").scanSync({
        cwd: this.buildDir,
        onlyFiles: true,
        dot: true,
      })
    );
    for (const file of glob) {
      this.buildRoutes.set(file, Bun.file(join(this.buildDir, file)));
    }
  }

  getRoutePaths() {
    return Array.from(this.routes.keys());
  }
  getFromRoutePath(
    path: string
  ): { page: RoutePage; layouts: Array<RoutePage> } | undefined {
    const searchPage = join(path, "index.tsx");
    const page = this.routes.get(
      searchPage.startsWith("/") ? searchPage.slice(1) : searchPage
    );
    const layoutsPaths = Array.from(this.routes.entries())
      .map(([k, v]) => k)
      .filter((k) => k.endsWith("layout.tsx"));

    const relatedLayoutPaths = getRelatedLayoutPaths(
      path,
      layoutsPaths,
      this.pageDir
    ).map((p) => (p.startsWith("/") ? p.slice(1) : p));
    const ralatedLayouts = relatedLayoutPaths.map(
      (path) => this.routes.get(path)!
    );

    return page ? { page, layouts: ralatedLayouts } : undefined;
  }

  registerRoute(path: string, page: RoutePage) {
    this.routes.set(path, page);
  }
}

export default Router;

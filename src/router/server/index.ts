"server only";

import { join } from "path";

type RouterProps = {
  pageDir: string;
  buildDir: string;
};

class Router {
  private buildDir: string;
  private pageDir: string;
  fileSystemRouterServer: Bun.FileSystemRouter;
  fileSystemRouterClient: Bun.FileSystemRouter;
  private cwd = process.cwd();

  constructor(props: RouterProps) {
    this.buildDir = props.buildDir;
    this.pageDir = props.pageDir;
    this.fileSystemRouterServer = new Bun.FileSystemRouter({
      dir: join(this.cwd, props.pageDir),
      style: "nextjs",
    });
    this.fileSystemRouterClient = new Bun.FileSystemRouter({
      dir: join(this.cwd, this.buildDir, this.pageDir),
      style: "nextjs",
    });
  }

  public createClientFileSystemRouter() {
    this.fileSystemRouterClient = new Bun.FileSystemRouter({
      dir: join(this.cwd, this.buildDir, this.pageDir),
      style: "nextjs",
    });
  }

  public matchServer(request: Request) {
    if (!request.headers.get("accept")?.includes("text/html")) return null;
    return this.fileSystemRouterServer.match(request);
  }
  public matchClient(request: Request) {
    return this.fileSystemRouterClient.match(request);
  }

  static async createRouter(props: RouterProps): Promise<Router> {
    const router = new Router(props);
    return router;
  }

  public reset() {
    this.fileSystemRouterClient.reload();
    this.fileSystemRouterServer.reload();
  }
  /** return array of layouts MatchedRoute */
  public getRelatedLayouts(pathname: string): Array<Bun.MatchedRoute> {
    const layoutsPathnames = Object.keys(
      this.fileSystemRouterServer.routes
    ).filter((pathname) => pathname.endsWith("/layout"));

    return pathname
      .split("/")
      .reduce<string[]>((acc, _, index, arr) => {
        const layoutPath = arr.slice(0, index + 1).join("/") + "/layout";
        if (layoutsPathnames.includes(layoutPath)) {
          acc.push(layoutPath);
        }
        return acc;
      }, [])
      .map((layoutPath) => this.fileSystemRouterServer.match(layoutPath)!);
  }
}

export default Router;

import Router from "../src/router/server";

const router = new Router({
  buildDir: "build",
  pageDir: "src/pages",
});

console.log({
  client: router.fileSystemRouterClient,
  server: router.fileSystemRouterServer,
});

export default router;

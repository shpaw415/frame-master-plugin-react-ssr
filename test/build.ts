import router from ".";

Bun.build({
  outdir: "build",
  entrypoints: Object.values(router.fileSystemRouterServer.routes),
  splitting: true,
});

import { FrameMasterConfig } from "frame-master/server/types";
import ReactSSRPlugin from ".";

export default {
  HTTPServer: {
    port: 3000,
  },
  plugins: [
    ReactSSRPlugin({
      pathToPagesDir: "test-project/src/pages",
      pathToBuildDir: "test-project/.frame-master/build",
      pathToShellFile: "init/shell.default.tsx",
      pathToClientWrapper: "init/client-wrapper.tsx",
      debug: false,
    }),
  ],
} satisfies FrameMasterConfig;

import { PATH_TO_REACT_SSR_PLUGIN } from "../index";
import { join } from "path";
import Paths from "frame-master/paths";

export default async function initPlugin() {
  console.log("Initializing React SSR plugin...");

  // copy default shell to the project
  await Bun.write(
    join(Paths.pathToConfigDir, "shell.tsx"),
    Bun.file(join(PATH_TO_REACT_SSR_PLUGIN, "init", "shell.default.tsx"))
  );

  // copy client wrapper to the project
  await Bun.write(
    join(Paths.pathToConfigDir, "client-wrapper.tsx"),
    Bun.file(join(PATH_TO_REACT_SSR_PLUGIN, "init", "client-wrapper.tsx"))
  );

  console.log(
    [
      '✅ Created [ shell.tsx, client-wrapper.tsx ] in the frame-master config directory ".frame-master".',
      "import ReactSSRPlugin from 'frame-master-plugin-react-ssr';",
      '{ pathToShellFile: ".frame-master/shell.tsx", pathToClientWrapper: ".frame-master/client-wrapper.tsx"}',
    ].join("\n")
  );
}

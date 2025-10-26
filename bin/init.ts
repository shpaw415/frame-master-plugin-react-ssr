import { PATH_TO_REACT_SSR_PLUGIN } from "../index";
import { join } from "path";
import Paths from "frame-master/paths";

export default async function initPlugin() {
  console.log("Initializing React SSR plugin...");

  // copy default shell to the project if it does not exists
  const defaultShellFile = Bun.file(
    join(PATH_TO_REACT_SSR_PLUGIN, "init", "shell.default.tsx")
  );
  const projectShellFile = Bun.file(join(Paths.pathToConfigDir, "shell.tsx"));

  if (!(await projectShellFile.exists()))
    await Bun.write(projectShellFile, defaultShellFile);

  // copy client wrapper to the project if it does not exists
  const defaultClientWrapperFile = Bun.file(
    join(PATH_TO_REACT_SSR_PLUGIN, "init", "client-wrapper.tsx")
  );
  const projectClientWrapperFile = Bun.file(
    join(Paths.pathToConfigDir, "client-wrapper.tsx")
  );
  if (!(await projectClientWrapperFile.exists()))
    await Bun.write(projectClientWrapperFile, defaultClientWrapperFile);

  console.log(
    [
      '✅ Created [ shell.tsx, client-wrapper.tsx ] in the frame-master config directory ".frame-master".',
      "import ReactSSRPlugin from 'frame-master-plugin-react-ssr';",
      '{ pathToShellFile: ".frame-master/shell.tsx", pathToClientWrapper: ".frame-master/client-wrapper.tsx"}',
    ].join("\n")
  );
}

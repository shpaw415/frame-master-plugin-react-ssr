import { PATH_TO_REACT_SSR_PLUGIN } from "../index";
import { join } from "path";
import Paths from "frame-master/paths";
export default async function initPlugin() {
  console.log("Initializing React SSR plugin...");

  await Bun.write(
    join(Paths.pathToConfigDir, "shell.tsx"),
    Bun.file(join(PATH_TO_REACT_SSR_PLUGIN, "init", "shell.default.tsx"))
  );
  /*
  await Bun.write(
    join(Paths.pathToConfigDir, "hydrate.tsx"),
    Bun.file(join(PATH_TO_REACT_SSR_PLUGIN, "init", "hydrate.tsx"))
  );
  */

  console.log(
    [
      "✅ Created shell.tsx in project root.",
      "import ReactSSRPlugin from 'frame-master-plugin-react-ssr';",
      "pathToShellFile: './shell.tsx',",
    ].join("\n")
  );
}

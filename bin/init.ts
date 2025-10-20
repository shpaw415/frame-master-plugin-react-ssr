import { PATH_TO_REACT_SSR_PLUGIN } from "../index";
import { join } from "path";
export default async function initPlugin() {
  console.log("Initializing React SSR plugin...");

  await Bun.write(
    join(process.cwd(), "shell.tsx"),
    Bun.file(join(PATH_TO_REACT_SSR_PLUGIN, "init", "shell.default.tsx"))
  );

  console.log(
    [
      "✅ Created shell.tsx in project root.",
      "import ReactSSRPlugin from 'frame-master-plugin-react-ssr';",
      "pathToShellFile: './shell.tsx',",
    ].join("\n")
  );
}

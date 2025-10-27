import { PATH_TO_REACT_SSR_PLUGIN } from "../index";
import { join } from "path";
import Paths from "frame-master/paths";
import { mkdirSync } from "fs";

export default async function initPlugin() {
  console.log("Initializing React SSR plugin...");

  // copy default shell to the project if it does not exists
  const defaultShellFile = Bun.file(
    join(PATH_TO_REACT_SSR_PLUGIN, "init", "shell.default.tsx")
  );
  const projectShellFile = Bun.file(join(Paths.pathToConfigDir, "shell.tsx"));

  if (!(await projectShellFile.exists()))
    await Bun.write(projectShellFile, await defaultShellFile.text());

  // copy client wrapper to the project if it does not exists
  const defaultClientWrapperFile = Bun.file(
    join(PATH_TO_REACT_SSR_PLUGIN, "init", "client-wrapper.tsx")
  );
  const projectClientWrapperFile = Bun.file(
    join(Paths.pathToConfigDir, "client-wrapper.tsx")
  );
  if (!(await projectClientWrapperFile.exists()))
    await Bun.write(
      projectClientWrapperFile,
      await defaultClientWrapperFile.text()
    );

  try {
    mkdirSync("src/pages", {
      recursive: true,
    });
  } catch {
    console.error(
      "cannot create src/pages it might be unwritable or already exists"
    );
  }
  const projectPresentationFile = Bun.file(join("src", "pages", "index.tsx"));
  if (!(await projectPresentationFile.exists()))
    await Bun.write(
      projectPresentationFile,
      await Bun.file(
        join(PATH_TO_REACT_SSR_PLUGIN, "init", "presentation.tsx")
      ).text()
    );

  console.log(
    [
      "",
      "\x1b[32m✅ Successfully created files:\x1b[0m",
      "   • shell.tsx",
      "   • client-wrapper.tsx",
      '   \x1b[90min ".frame-master/" directory\x1b[0m',
      "",
      "\x1b[36m📝 Add to your config:\x1b[0m",
      "",
      "   \x1b[36mimport\x1b[0m ReactSSRPlugin \x1b[36mfrom\x1b[0m \x1b[33m'frame-master-plugin-react-ssr'\x1b[0m\x1b[36m;\x1b[0m",
      "",
      "   \x1b[90mReactSSRPlugin(\x1b[0m{",
      '     pathToShellFile: \x1b[33m".frame-master/shell.tsx"\x1b[0m,',
      '     pathToClientWrapper: \x1b[33m".frame-master/client-wrapper.tsx"\x1b[0m',
      '     pathToBuildDir: \x1b[33m".frame-master/build"\x1b[0m',
      "   }\x1b[90m)\x1b[0m",
      "",
    ].join("\n")
  );
}

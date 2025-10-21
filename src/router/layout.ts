import { join } from "@/utils";
import type { JSX } from "react";

type LayoutElementFunction = (props: { children: JSX.Element }) => JSX.Element;

type LayoutStackProps = {
  children: JSX.Element;
  layouts: Array<LayoutElementFunction>;
};

export function StackLayouts({ children, layouts }: LayoutStackProps) {
  return layouts.reduceRight((children, Layout) => {
    return Layout({ children });
  }, children);
}

export async function importLayouts(layoutsPaths: string[]) {
  if (globalThis.process.env.NODE_ENV === "development") {
    const searchParams = new URLSearchParams();
    searchParams.set("t", new Date().getTime().toString());
    layoutsPaths = layoutsPaths.map(
      (layoutPath) => layoutPath + "?" + searchParams.toString()
    );
  }

  return (await Promise.all(
    layoutsPaths.map(
      (layoutPath) =>
        import(
          "/" +
            join(
              globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir,
              layoutPath
            )
        )
    )
  )) as Array<{ default: () => JSX.Element }>;
}

/**
 * return the path of related layouts for a given path
 * @param path - the current path
 * @param layouts - the list of available layout paths
 * @returns an array of layout paths that are related to the given path
 */
export function getRelatedLayoutPaths(
  path: string,
  layouts: string[],
  basePath: string
): string[] {
  const relatedLayouts: string[] = [];
  !path.startsWith("/") && (path = "/" + path);
  const segments = path.split("/").filter(Boolean);
  basePath = basePath.startsWith("/") ? basePath : "/" + basePath;
  const _layouts = layouts
    .map((layoutPath) =>
      layoutPath.startsWith(basePath)
        ? layoutPath.replace(basePath, "")
        : layoutPath
    )
    .map((layoutPath) =>
      layoutPath.startsWith("/") ? layoutPath : "/" + layoutPath
    );

  console.log("getRelatedLayoutPaths", { path, layouts, _layouts, segments });

  let currentPath = "";

  if (segments.length === 0) {
    const layoutRegex = new RegExp(`^/layout\\.(tsx|js)$`);
    const matchedLayout = _layouts.find((layout) => layoutRegex.test(layout));
    if (matchedLayout) {
      relatedLayouts.push(matchedLayout);
    }
    return relatedLayouts;
  }

  for (const segment of segments) {
    if (currentPath.length == 0) currentPath += segment;
    else currentPath += `/${segment}`;
    const layoutRegex = new RegExp(`^/${currentPath}/layout\\.(tsx|js)$`);
    const matchedLayout = _layouts.find((layout) => layoutRegex.test(layout));
    if (matchedLayout) {
      relatedLayouts.push(matchedLayout);
    }
  }

  return relatedLayouts;
}

export function layoutGetter(
  currentPath: string,
  layoutsList: Array<string>,
  basePath: string
) {
  const related = getRelatedLayoutPaths(currentPath, layoutsList, basePath);
  console.log("layoutGetter", { currentPath, related });
  return importLayouts(related);
}

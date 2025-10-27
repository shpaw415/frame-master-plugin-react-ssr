import { join } from "../utils";
import type { JSX } from "react";

type LayoutElementFunction = (props: { children: JSX.Element }) => JSX.Element;

type LayoutStackProps = {
  children: JSX.Element;
  layouts: Array<LayoutElementFunction>;
};

export function StackLayouts({ children, layouts }: LayoutStackProps) {
  if (!globalThis.__REACT_SSR_PLUGIN_OPTIONS__.enableLayout) return children;
  return layouts.reduceRight((acc, Layout) => {
    return Layout({ children: acc });
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

  // Normalize paths
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  const normalizedBasePath = basePath.startsWith("/")
    ? basePath
    : "/" + basePath;
  const segments = normalizedPath.split("/").filter(Boolean);

  // Normalize layout paths by removing basePath prefix
  const normalizedLayouts = layouts.map((layoutPath) => {
    if (layoutPath.startsWith(normalizedBasePath)) {
      const withoutBase = layoutPath.slice(normalizedBasePath.length);
      return withoutBase.startsWith("/") ? withoutBase : "/" + withoutBase;
    }
    return layoutPath.startsWith("/") ? layoutPath : "/" + layoutPath;
  });

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Check for root layout
  const rootLayoutRegex = /^\/layout\.(tsx|js)$/;
  const rootLayout = normalizedLayouts.find((layout) =>
    rootLayoutRegex.test(layout)
  );
  if (rootLayout) {
    relatedLayouts.push(rootLayout);
  }

  // Check for nested layouts
  let currentPath = "";
  for (const segment of segments) {
    currentPath = currentPath ? join(currentPath, segment) : segment;
    const escapedPath = escapeRegex(currentPath);
    const layoutRegex = new RegExp(`^/${escapedPath}/layout\\.(tsx|js)$`);
    const matchedLayout = normalizedLayouts.find((layout) =>
      layoutRegex.test(layout)
    );
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
  return importLayouts(related);
}

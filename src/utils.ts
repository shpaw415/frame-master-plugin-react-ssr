import type { masterRequest } from "frame-master/server/request";
import type { JSX } from "react";

export function join(...parts: string[]) {
  return parts
    .map((part, index) => {
      if (index === 0) {
        // First part: remove trailing slashes only
        return part.replace(/\/+$/g, "");
      } else if (index === parts.length - 1) {
        // Last part: remove leading slashes only (preserve filenames like index.js)
        return part.replace(/^\/+/g, "");
      } else {
        // Middle parts: remove both leading and trailing slashes
        return part.replace(/^\/+|\/+$/g, "");
      }
    })
    .filter((part) => part.length > 0)
    .join("/");
}

export function routeGetter(request: masterRequest | null) {
  return request
    ? (request.getContext() as { __ROUTES__: typeof globalThis.__ROUTES__ })
        .__ROUTES__
    : globalThis.__ROUTES__;
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
  basePath: string = "/src/pages"
): string[] {
  const relatedLayouts: string[] = [];
  !path.startsWith("/") && (path = "/" + path);
  const segments = path.split("/").filter(Boolean);
  const _layouts = layouts
    .map((layoutPath) =>
      layoutPath.startsWith(basePath)
        ? layoutPath.replace(basePath, "")
        : layoutPath
    )
    .map((layoutPath) =>
      layoutPath.startsWith("/") ? layoutPath : "/" + layoutPath
    );

  let currentPath = "";
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

export async function importLayouts(layoutsPaths: string[]) {
  if (process.env.NODE_ENV === "development") {
    const searchParams = new URLSearchParams();
    searchParams.set("t", new Date().getTime().toString());
    layoutsPaths = layoutsPaths.map(
      (layoutPath) => layoutPath + "?" + searchParams.toString()
    );
  }

  return (await Promise.all(
    layoutsPaths.map(
      (layoutPath) => import("/" + join("src", "pages", layoutPath))
    )
  )) as Array<{ default: () => JSX.Element }>;
}

export function StackLayouts(
  page: JSX.Element,
  layouts: Array<(props: { children: JSX.Element }) => JSX.Element>
) {
  return layouts.reduceRight((children, Layout) => {
    return Layout({ children });
  }, page);
}

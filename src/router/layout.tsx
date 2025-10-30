import { useRouteEffect } from "../hooks";
import { join } from "../utils";
import { useCallback, useMemo, useState, type JSX } from "react";

type LayoutElementFunction = (props: { children: JSX.Element }) => JSX.Element;

type LayoutStackProps = {
  children: JSX.Element;
  layouts: Array<LayoutElementFunction>;
};

export function StackLayouts({
  children,
  layouts,
}: LayoutStackProps): JSX.Element {
  if (!globalThis.__REACT_SSR_PLUGIN_OPTIONS__.enableLayout) return children;

  return useMemo(() => {
    let Stack = children;
    for (let i = layouts.length - 1; i >= 0; i--) {
      const Layout = layouts[i]!;
      Stack = <Layout>{Stack}</Layout>;
    }
    return Stack;
  }, [children, layouts]);
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
    layoutsPaths.map((layoutPath) => import(layoutPath))
  )) as Array<{ default: () => JSX.Element }>;
}

/**
 * return the path of related layouts for a given path
 * @param path - the current path
 * @param layouts - the list of available layout paths
 * @returns an array of layout paths that are related to the given path
 */
export function getRelatedLayoutPaths(
  pathname: string,
  layouts: string[]
): string[] {
  return pathname.split("/").reduce<string[]>((acc, _, index, arr) => {
    const layoutPath = arr.slice(0, index + 1).join("/") + "/layout";
    if (layouts.includes(layoutPath)) {
      acc.push(layoutPath);
    }
    return acc;
  }, []);
}

export function layoutGetter(pathname: string, layoutsList: Array<string>) {
  const related = getRelatedLayoutPaths(pathname, layoutsList);
  return importLayouts(related);
}

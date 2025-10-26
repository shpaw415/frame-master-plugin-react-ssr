"use client";
import { join } from "../utils";
import { StackLayouts, layoutGetter } from "./layout";
import type { JSX } from "react";

/** Create the page by pathname to use with the Shell in hydrate */
export async function createPageByPathname(pathname: string) {
  const page = (await import(
    "/" +
      join(
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir,
        pathname,
        "index.js"
      )
  )) as {
    default: () => JSX.Element;
  };
  const layoutRoutes = globalThis.__ROUTES__
    .filter((path) => path.endsWith("layout.js"))
    .map(
      (path) =>
        "/" + join(globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir, path)
    );

  const layouts = await layoutGetter(
    pathname,
    layoutRoutes,
    globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir
  );

  return (
    <StackLayouts layouts={layouts.map((_module) => _module.default)}>
      <page.default />
    </StackLayouts>
  );
}

export async function Shell({
  pathname,
}: {
  pathname: string;
}): Promise<JSX.Element> {
  const ClientWrapperModule = (await import(
    "/" +
      join(
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToClientWrapper
          .split(".")
          .slice(0, -1)
          .join(".") + ".js"
      )
  )) as {
    default: (props: { children: JSX.Element }) => JSX.Element;
  };

  return (
    <ClientWrapperModule.default>
      {await createPageByPathname(pathname)}
    </ClientWrapperModule.default>
  );
}

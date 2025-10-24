/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { hydrateRoot } from "react-dom/client";
import type { JSX } from "react";
import { join } from "../utils";
import { layoutGetter, StackLayouts } from "../router/layout";
import { jsxDEV, type JSXSource } from "react/jsx-dev-runtime";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React from "react";

declare global {
  var jsx_w77yafs4: (
    type: React.ElementType,
    props: unknown,
    key?: React.Key
  ) => React.ReactElement;
  var jsx: (
    type: React.ElementType,
    props: unknown,
    key?: React.Key
  ) => React.ReactElement;
  var jsxDEV_7x81h0kn: (
    type: React.ElementType,
    props: unknown,
    key: React.Key | undefined,
    isStatic: boolean,
    source?: JSXSource,
    self?: unknown
  ) => React.ReactElement;
  var jsxDEV: (
    type: React.ElementType,
    props: unknown,
    key: React.Key | undefined,
    isStatic: boolean,
    source?: JSXSource,
    self?: unknown
  ) => React.ReactElement;
  //@ts-ignore
  var jsxs_eh6c78nj: (
    type: React.ElementType,
    props: unknown,
    key?: React.Key
  ) => React.ReactElement;
  var jsxs: (
    type: React.ElementType,
    props: unknown,
    key?: React.Key
  ) => React.ReactElement;
  var Fragment_8vg9x3sq: React.ExoticComponent<{
    children?: React.ReactNode | undefined;
  }>;
  var Fragment: React.ExoticComponent<{
    children?: React.ReactNode | undefined;
  }>;
}

globalThis.React = React;
globalThis.jsx_w77yafs4 = jsx;
globalThis.jsx = jsx;
globalThis.jsxDEV_7x81h0kn = jsxDEV;
globalThis.jsxDEV = jsxDEV;
globalThis.jsxs_eh6c78nj = jsxs;
globalThis.jsxs = jsxs;
globalThis.Fragment_8vg9x3sq = Fragment;
globalThis.Fragment = Fragment;

async function start() {
  const url = new URL(window.location.href);
  const path = url.pathname;
  const Shell = (
    await import(
      "/" +
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToShellFile.replace(
          ".tsx",
          ".js"
        )
    )
  ).default;
  const page = (await import(
    "/" +
      join(
        globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir,
        path,
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
    url.pathname,
    layoutRoutes,
    globalThis.__REACT_SSR_PLUGIN_OPTIONS__.pathToPagesDir
  );

  hydrateRoot(
    document.getElementById("root")!,
    <Shell request={null}>
      <StackLayouts layouts={layouts.map((_module) => _module.default)}>
        <page.default />
      </StackLayouts>
    </Shell>
  );
}

if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else if (typeof document !== "undefined") {
  start();
}

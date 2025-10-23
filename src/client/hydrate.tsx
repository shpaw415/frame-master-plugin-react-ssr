/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { hydrateRoot } from "react-dom/client";
import Shell from "../Shell";
import type { JSX } from "react";
import { join } from "../utils";
import { layoutGetter, StackLayouts } from "../router/layout";
import { fixReact } from "./fix-react";

fixReact();

async function start() {
  const url = new URL(window.location.href);
  const path = url.pathname;
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

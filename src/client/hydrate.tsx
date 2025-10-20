/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { hydrateRoot } from "react-dom/client";
import Shell from "../Shell";
import type { JSX } from "react";
import { join } from "@/utils";
import { layoutGetter, LayoutStack } from "@/router/client";

async function start() {
  const url = new URL(window.location.href);
  const path = url.pathname;
  const page = (await import("/" + join("src", "pages", path, "index.js"))) as {
    default: () => JSX.Element;
  };
  const layoutRoutes = globalThis.__ROUTES__
    .filter((path) => path.endsWith("layout.js"))
    .map((path) => "/" + join("src", "pages", path));
  const layouts = await layoutGetter(url.pathname, layoutRoutes);
  hydrateRoot(
    document.getElementById("root")!,
    <Shell request={null}>
      <LayoutStack layouts={layouts.map((_module) => _module.default)}>
        <page.default />
      </LayoutStack>
    </Shell>
  );
}

if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else if (typeof document !== "undefined") {
  start();
}

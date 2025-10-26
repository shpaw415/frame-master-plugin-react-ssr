import { hydrateRoot } from "react-dom/client";
import { Shell } from "frame-master-plugin-react-ssr/router/utils";
import "frame-master-plugin-react-ssr/client/init";

async function start() {
  hydrateRoot(
    document.getElementById("root")!,
    await Shell({
      pathname: new URL(window.location.href).pathname,
    })
  );
}

if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else if (typeof document !== "undefined") {
  start();
}

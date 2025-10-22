import { useRoute } from "../hooks";
import { createContext, useEffect, useRef } from "react";

const DevContext = createContext<{ ws: WebSocket } | null>(null);

export function DevProvider({ children }: { children: React.ReactNode }) {
  const router = useRoute();
  const ws = useRef<null | WebSocket>(null);
  useEffect(() => {
    ws.current = new WebSocket(
      `${location.protocol == "http:" ? "ws" : "wss"}://${location.host}/hmr`
    );
    ws.current.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as {
        type: "reload" | "update";
      };

      if (data.type === "reload") {
        console.log("[HMR] Reloading page...");
        location.reload();
      }

      if (data.type === "update") {
        console.log("[HMR] Updating route:", router.pathname);
        router.navigate(router.pathname, router.searchParams);
      }
    });
  }, []);
  return (
    <DevContext.Provider value={{ ws: ws.current! }}>
      {children}
    </DevContext.Provider>
  );
}

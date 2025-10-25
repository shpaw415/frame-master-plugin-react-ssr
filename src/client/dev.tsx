import { useRoute } from "../hooks";
import { createContext, useEffect, useRef } from "react";

const DevContext = createContext<{ ws: WebSocket } | null>(null);

export function DevProvider({ children }: { children: React.ReactNode }) {
  const router = useRoute();
  const ws = useRef<null | WebSocket>(null);
  const routerRef = useRef(router);

  // Keep router ref up to date
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (process.env.NODE_ENV == "production") return;

    ws.current ??= new WebSocket(
      `${location.protocol == "http:" ? "ws" : "wss"}://${location.host}/hmr`
    );

    const eventHandler: (ev: MessageEvent<any>) => any = (event) => {
      const data = JSON.parse(event.data) as {
        type: "reload" | "update";
      };

      if (data.type === "reload") {
        console.log("[HMR] Reloading page...");
        location.reload();
      }

      if (data.type === "update") {
        console.log("[HMR] Updating route:", routerRef.current.pathname);
        routerRef.current.reload();
      }
    };

    ws.current.addEventListener("message", eventHandler);
    return () => {
      ws.current?.removeEventListener("message", eventHandler);
    };
  }, []); // Empty dependency array - only run once

  return (
    <DevContext.Provider value={{ ws: ws.current! }}>
      {children}
    </DevContext.Provider>
  );
}

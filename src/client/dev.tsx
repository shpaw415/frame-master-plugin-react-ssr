import { useRoute } from "@/router/client";
import { createContext, useEffect, useRef } from "react";

const DevContext = createContext<{ ws: WebSocket } | null>(null);

export function DevProvider({ children }: { children: React.ReactNode }) {
  const router = useRoute();
  const ws = useRef<null | WebSocket>(null);
  useEffect(() => {
    ws.current = new WebSocket(
      `${location.protocol == "http:" ? "ws" : "wss"}://${location.host}`
    );
    ws.current.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "reload") {
        console.log("[HMR] Reloading page...");
        location.reload();
        router.navigate(router.pathname);
      }

      if (data.type === "update") {
        console.log("[HMR] Update received:", data.url);
        import(`${data.url}?t=${Date.now()}`)
          .then(() => console.log("[HMR] Module updated:", data.url))
          .catch(() => location.reload());
      }
    });
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    document
      .getElementById("tailwind_link")
      ?.setAttribute("href", "/public/out.css?t=" + Date.now());
  });
  return (
    <DevContext.Provider value={{ ws: ws.current! }}>
      {children}
    </DevContext.Provider>
  );
}

import { createContext } from "react";
import type { masterRequest } from "frame-master/server/request";

export const RequestContext = createContext<masterRequest | null>(null);
export function RequestProvider({
  children,
  req,
}: {
  children: React.ReactNode;
  req: masterRequest | null;
}) {
  return (
    <RequestContext.Provider value={req}>{children}</RequestContext.Provider>
  );
}

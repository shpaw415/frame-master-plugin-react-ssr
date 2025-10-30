import type { masterRequest } from "frame-master/server/request";
import { RequestContext } from "./contexts";
import { type JSX } from "react";

export function RequestProvider({
  request,
  children,
}: {
  request: masterRequest | null;
  children: JSX.Element;
}) {
  return (
    <RequestContext.Provider value={request}>
      {children}
    </RequestContext.Provider>
  );
}

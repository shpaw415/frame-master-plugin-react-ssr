import type { masterRequest } from "frame-master/server/request";
import { createContext, useContext } from "react";

export const requestContext = createContext<masterRequest | null>(null);
export function useRequest() {
  return useContext(requestContext);
}

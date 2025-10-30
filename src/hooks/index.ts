import type { RouteMatch } from "../router/client/route-matcher";
import {
  RequestContext,
  CurrentRouteContext,
  type CurrentRouteContextType,
} from "./contexts";
import { useContext, useEffect, type EffectCallback } from "react";

export function useRequest() {
  return useContext(RequestContext);
}

export function useRoute<
  Params extends RouteMatch["params"] = {}
>(): CurrentRouteContextType<Params> {
  return useContext(CurrentRouteContext) as CurrentRouteContextType<Params>;
}

/**
 * Effect that runs when the route changes, but not on initial page load.
 * @param onRouteChange Callback to run when route changes
 */
export function useRouteEffect(
  onRouteChange: EffectCallback,
  deps: Array<unknown> = []
) {
  const route = useRoute();
  useEffect(() => {
    if (route.isInitial) return;
    return onRouteChange();
  }, [route.version, onRouteChange, ...deps]);
}

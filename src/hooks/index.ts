import { ServerSidePropsContext } from "./contexts";
import type { ServerSidePropsResult } from "../features/serverSideProps/server";
import {
  RequestContext,
  CurrentRouteContext,
  type CurrentRouteContextType,
} from "./contexts";
import { useContext, useEffect, type EffectCallback } from "react";

export function useRequest() {
  return useContext(RequestContext);
}

export function useRoute(): CurrentRouteContextType {
  return useContext(CurrentRouteContext);
}

/**
 * Effect that runs when the route changes, but not on initial page load.
 * @param onRouteChange Callback to run when route changes
 */
export function useRouteEffect(onRouteChange: EffectCallback) {
  const route = useRoute();
  useEffect(() => {
    if (route.isInitial) return;
    return onRouteChange();
  }, [route.version]);
}

export function useServerSideProps<
  AwaitedResult extends unknown = {}
>(): Partial<ServerSidePropsResult & AwaitedResult> {
  const serversideProps = useContext(
    ServerSidePropsContext
  ) as ServerSidePropsResult & AwaitedResult;
  return serversideProps;
}

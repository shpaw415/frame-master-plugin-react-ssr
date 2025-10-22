import { ServerSidePropsContext } from "../features/serverSideProps/client";
import type { ServerSidePropsResult } from "../features/serverSideProps/server";
import {
  CurrentRouteContext,
  type CurrentRouteContextType,
} from "../router/client";
import type { masterRequest } from "frame-master/server/request";
import {
  createContext,
  useContext,
  useEffect,
  type EffectCallback,
} from "react";

export const requestContext = createContext<masterRequest | null>(null);
export function useRequest() {
  return useContext(requestContext);
}

export function useRoute(): CurrentRouteContextType {
  return useContext(CurrentRouteContext) as CurrentRouteContextType;
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

export function useServerSideProps<AwaitedResult extends unknown = {}>() {
  const serversideProps = useContext(
    ServerSidePropsContext
  ) as ServerSidePropsResult & AwaitedResult;
  return serversideProps;
}

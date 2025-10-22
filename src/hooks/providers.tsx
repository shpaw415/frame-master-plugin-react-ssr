import type { masterRequest } from "frame-master/server/request";
import { RequestContext, ServerSidePropsContext } from "./contexts";
import { useCallback, useState, type JSX } from "react";
import type { ServerSidePropsResult } from "../features/serverSideProps/server";
import { useRequest, useRoute, useRouteEffect } from ".";
import type { reactSSRPluginContext } from "../..";
import LoadingFallback from "../fallbacks/loading";

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

export function ServerSidePropsProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const request = useRequest();
  const [props, setProps] = useState(
    request
      ? request.getContext<reactSSRPluginContext>()
          .__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__
      : globalThis.__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__
  );
  const route = useRoute();
  const onRouteChangeHandler = useCallback<
    (props: ServerSidePropsResult) => void
  >((props) => {
    setProps(props);
  }, []);
  useRouteEffect(() => {
    fetchServerSideProps(route.pathname).then(onRouteChangeHandler);
  });

  return (
    <ServerSidePropsContext.Provider value={props}>
      {children}
    </ServerSidePropsContext.Provider>
  );
}

function fetchServerSideProps(path: string) {
  return fetch(path, {
    headers: {
      "x-server-side-props": "true",
    },
  }).then(
    (res) => res.json() as unknown as Omit<ServerSidePropsResult, "undefined">
  );
}

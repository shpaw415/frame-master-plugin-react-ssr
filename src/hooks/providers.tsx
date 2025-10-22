import type { masterRequest } from "frame-master/server/request";
import { RequestContext, ServerSidePropsContext } from "./contexts";
import { useState, type JSX } from "react";
import type { ServerSidePropsResult } from "../features/serverSideProps/server";
import { useRequest, useRoute, useRouteEffect } from ".";
import type { reactSSRPluginContext } from "../..";

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
  abortController,
}: {
  children: JSX.Element;
  abortController: AbortController;
}) {
  const request = useRequest();
  const [props, setProps] = useState(
    request
      ? request.getContext<reactSSRPluginContext>()
          .__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__
      : globalThis.__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__
  );
  const route = useRoute();
  useRouteEffect(() => {
    setProps(null);
    fetchServerSideProps(route.pathname, abortController).then(setProps);
  });

  return (
    <ServerSidePropsContext.Provider value={props}>
      {children}
    </ServerSidePropsContext.Provider>
  );
}

function fetchServerSideProps(path: string, abortController: AbortController) {
  return fetch(path, {
    headers: {
      "x-server-side-props": "true",
    },
    signal: abortController.signal,
  }).then(
    (res) => res.json() as unknown as Omit<ServerSidePropsResult, "undefined">
  );
}

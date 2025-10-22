import { createContext, type JSX, useState } from "react";
import type {
  ServerSidePropsContext as RequestSSPContext,
  ServerSidePropsResult,
} from "./server";
import { useRequest, useRoute, useRouteEffect } from "@/hooks";

export const ServerSidePropsContext =
  createContext<ServerSidePropsResult>(undefined);

export function ServerSidePropsProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const request = useRequest();
  const [props, setProps] = useState(
    request
      ? request.getContext<RequestSSPContext>().props
      : globalThis.__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS__
  );
  const route = useRoute();
  useRouteEffect(() => {
    fetchServerSideProps(route.pathname).then(setProps);
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

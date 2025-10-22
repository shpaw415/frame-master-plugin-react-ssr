import { createContext, type JSX } from "react";
import type {
  ServerSidePropsContext as RequestSSPContext,
  ServerSidePropsResult,
} from "./server";
import { useRequest } from "@/hooks";

export const ServerSidePropsContext =
  createContext<ServerSidePropsResult>(undefined);

export function ServerSidePropsProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const request = useRequest();
  const props = request
    ? request.getContext<RequestSSPContext>().props
    : globalThis.__REACT_SSR_PLUGIN_SERVER_SIDE_PROPS;
  return (
    <ServerSidePropsContext.Provider value={props}>
      {children}
    </ServerSidePropsContext.Provider>
  );
}

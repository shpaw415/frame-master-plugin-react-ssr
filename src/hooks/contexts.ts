import type { masterRequest } from "frame-master/server/request";
import { createContext } from "react";
import type { ServerSidePropsResult } from "../features/serverSideProps/server";

type RouteSetter = (
  to: string,
  searchParams?: Record<string, string> | URLSearchParams
) => void;

export type currentRouteType = {
  pathname: string;
  searchParams: URLSearchParams;
};

export type CurrentRouteContextType = currentRouteType & {
  navigate: RouteSetter;
  reload: () => void;
  isInitial: boolean;
  /** increment every time navigate or reload is triggered */
  version: number;
  /** current URL hash/anchor (e.g., "#section-1") */
  hash: string;
};
export const CurrentRouteContext = createContext<CurrentRouteContextType>(
  null as any
);
export const RequestContext = createContext<masterRequest | null>(null);

export const ServerSidePropsContext =
  createContext<ServerSidePropsResult>(undefined);

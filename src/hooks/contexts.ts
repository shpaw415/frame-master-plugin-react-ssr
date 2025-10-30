import type { masterRequest } from "frame-master/server/request";
import { createContext } from "react";
import type { RouteMatch } from "../router/client/route-matcher";

type RouteSetter = (
  to: string,
  searchParams?: Record<string, string> | URLSearchParams
) => void;

export type currentRouteType<Params extends RouteMatch["params"] = {}> = {
  pathname: string;
  searchParams: URLSearchParams;
  params: Params;
};

export type CurrentRouteContextType<Params extends RouteMatch["params"] = {}> =
  currentRouteType<Params> & {
    navigate: RouteSetter;
    reload: () => void;
    isInitial: boolean;
    /** increment every time navigate or reload is triggered */
    version: number;
    /** current URL hash/anchor (e.g., "#section-1") */
    hash: string;
    /** navigate to Anchor in the current page */
    navigateToAnchor: (anchorId: string, behavior?: ScrollBehavior) => void;
  };
export const CurrentRouteContext = createContext<CurrentRouteContextType>(
  null as any
);
export const RequestContext = createContext<masterRequest | null>(null);

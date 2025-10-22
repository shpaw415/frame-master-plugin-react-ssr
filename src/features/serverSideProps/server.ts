import type { masterRequest } from "frame-master/server/request";
import Router from "../../router/server";

const cwd = process.cwd();

export type getServerSidePropsFunctionType = (
  request: masterRequest
) => ServerSidePropsResult | Promise<ServerSidePropsResult>;

export type ServerSidePropsResult =
  | Record<string, unknown>
  | null
  | undefined
  | { redirect: string };

export type ServerSidePropsContext = {
  props: ServerSidePropsResult;
};

export function getServerSideProps(
  request: masterRequest,
  router: Router
): ServerSidePropsResult | Promise<ServerSidePropsResult> | null {
  if (
    !request.request.headers.get("x-server-side-props") &&
    !request.isAskingHTML
  )
    return null;
  return (
    router
      .getPageModuleByPathname<{
        getServerSideProps?: getServerSidePropsFunctionType;
      }>(request.URL.pathname)
      ?.getServerSideProps?.(request) ?? null
  );
}

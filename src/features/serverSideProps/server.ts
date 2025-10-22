import type { masterRequest } from "frame-master/server/request";
import { join } from "path";
import type { ReactSSRPluginOptions } from "../../..";

const cwd = process.cwd();

export type getServerSidePropsFunctionType = (
  request: masterRequest
) => ServerSidePropsResult | Promise<ServerSidePropsResult>;

export type ServerSidePropsResult =
  | Record<string, unknown>
  | undefined
  | { redirect: string };

export type ServerSidePropsContext = {
  props: ServerSidePropsResult;
};

export async function getServerSideProps(
  request: masterRequest,
  config: ReactSSRPluginOptions
): Promise<ServerSidePropsResult> {
  if (!request.request.headers.get("x-server-side-props")) return;
  const { getServerSideProps } = (await import(
    join(cwd, config.pathToPagesDir!, request.URL.pathname)
  )) as { getServerSideProps?: getServerSidePropsFunctionType };

  return await getServerSideProps?.(request);
}

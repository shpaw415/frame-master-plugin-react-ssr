"server only";

import type { JSX } from "react";
import { StackLayouts } from "../layout";
import { masterRequest } from "frame-master/server/request";
import { RequestProvider } from "../../hooks/providers";

export function pageToJSXElement({
  Shell,
  ClientWrapper,
  Page,
  request,
}: {
  Shell: (props: { children: JSX.Element }) => JSX.Element;
  ClientWrapper: (props: { children: JSX.Element }) => JSX.Element;
  Page: {
    page: { default: () => JSX.Element };
    layouts: Array<{ default: () => JSX.Element }>;
  };
  request: masterRequest;
}) {
  return (
    <RequestProvider request={request}>
      <Shell>
        <ClientWrapper>
          <StackLayouts layouts={Page.layouts.map((l) => l.default)}>
            <Page.page.default />
          </StackLayouts>
        </ClientWrapper>
      </Shell>
    </RequestProvider>
  );
}

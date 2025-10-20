import ReactSSRShell from "frame-master-plugin-react-ssr/shell";
import type { masterRequest } from "frame-master/server/request";
import type { JSX } from "react";

export default function Shell({
  children,
  request,
}: {
  children: JSX.Element;
  request: masterRequest | null;
}) {
  return (
    <html id="root">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Frame Master React SSR</title>
      </head>
      <body>
        <ReactSSRShell request={request}>{children}</ReactSSRShell>
      </body>
    </html>
  );
}

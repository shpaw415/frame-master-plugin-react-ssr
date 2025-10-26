import { StrictMode, type JSX } from "react";
//import { RouterHost } from "frame-master-plugin-react-ssr/router";

export default function Shell({ children }: { children: JSX.Element }) {
  return (
    <StrictMode>
      <html id="root">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Frame Master React SSR</title>
        </head>
        <body>{children}</body>
      </html>
    </StrictMode>
  );
}

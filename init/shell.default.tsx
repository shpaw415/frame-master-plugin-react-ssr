import { type JSX } from "react";

// this Shell is only for SSR purpose

export default function Shell({ children }: { children: JSX.Element }) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Frame Master React SSR</title>
      </head>
      <body id="root">{children}</body>
    </html>
  );
}

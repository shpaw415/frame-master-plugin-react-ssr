import { StrictMode, type JSX } from "react";
import { RouterHost } from "frame-master-plugin-react-ssr/router";
export default function ClientWrapper({ children }: { children: JSX.Element }) {
  return (
    <StrictMode>
      <RouterHost>{children}</RouterHost>
    </StrictMode>
  );
}

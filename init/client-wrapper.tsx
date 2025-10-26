import { StrictMode, type JSX } from "react";
import { RouterHost } from "frame-master-plugin-react-ssr/router";

// ClientWrapper is used client side only for state management
// you can create your own version of the routerHost

export default function ClientWrapper({ children }: { children: JSX.Element }) {
  return (
    <StrictMode>
      <RouterHost>{children}</RouterHost>
    </StrictMode>
  );
}

import type { masterRequest } from "frame-master/server/request";
import { RequestProvider } from "./plugin";
import { RouterHost } from "./router/client";
import type { JSX } from "react";
import { useMemo } from "react";

type ShellProps = {
  children: JSX.Element;
  request: masterRequest | null;
};

export default function Shell({ children, request }: ShellProps) {
  const initialPathname = useMemo(
    () => (request ? request.URL.pathname : window.location.pathname),
    []
  );
  const initialSearchParams = useMemo(() => {
    const params = request
      ? request.URL.searchParams
      : window.location.search
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
    return params;
  }, []);

  return (
    <RequestProvider req={request}>
      <RouterHost
        initialPath={{
          pathname: initialPathname,
          searchParams: initialSearchParams,
        }}
      >
        {children}
      </RouterHost>
    </RequestProvider>
  );
}

export function TriggerBuildForDevRoute(pathname: string) {
  return fetch(
    `/__react_ssr_plugin_dev_route__/${encodeURIComponent(pathname)}`
  );
}

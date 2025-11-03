export function TriggerBuildForDevRoute(pathname: string) {
  return fetch(
    `/__frame_master_dev_trigger_build_for_route/${encodeURIComponent(
      pathname
    )}`,
    {
      method: "PATCH",
    }
  );
}

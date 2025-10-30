/**
 * Next.js-style Route Matcher for Browser
 *
 * Supports:
 * - Static routes: /about, /blog
 * - Dynamic routes: /blog/[slug], /user/[id]
 * - Catch-all routes: /docs/[...slug]
 * - Optional catch-all routes: /docs/[[...slug]]
 * - Nested dynamic routes: /[category]/[id]
 */

export interface RouteMatch {
  params: Record<string, string | string[]>;
  route: string;
}

export interface RoutePattern {
  pattern: string;
  regex: RegExp;
  keys: Array<{ name: string; optional: boolean; catchAll: boolean }>;
}

/**
 * Converts a Next.js-style route pattern to a RegExp
 * @param route - The route pattern (e.g., "/blog/[slug]", "/docs/[...slug]")
 * @returns RoutePattern object with regex and parameter keys
 */
export function compileRoute(route: string): RoutePattern {
  const keys: Array<{ name: string; optional: boolean; catchAll: boolean }> =
    [];

  // Normalize route: ensure it starts with / and doesn't end with / (except root)
  let normalizedRoute = route;
  if (!normalizedRoute.startsWith("/")) {
    normalizedRoute = "/" + normalizedRoute;
  }
  if (normalizedRoute !== "/" && normalizedRoute.endsWith("/")) {
    normalizedRoute = normalizedRoute.slice(0, -1);
  }

  // Escape special regex characters except our markers
  let regexPattern = normalizedRoute
    .split("/")
    .map((segment) => {
      // Optional catch-all: [[...param]]
      const optionalCatchAllMatch = segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/);
      if (optionalCatchAllMatch && optionalCatchAllMatch[1]) {
        const paramName = optionalCatchAllMatch[1];
        keys.push({ name: paramName, optional: true, catchAll: true });
        return "(?:/(.*))?";
      }

      // Catch-all: [...param]
      const catchAllMatch = segment.match(/^\[\.\.\.([^\]]+)\]$/);
      if (catchAllMatch && catchAllMatch[1]) {
        const paramName = catchAllMatch[1];
        keys.push({ name: paramName, optional: false, catchAll: true });
        return "/(.+)";
      }

      // Dynamic parameter: [param]
      const dynamicMatch = segment.match(/^\[([^\]]+)\]$/);
      if (dynamicMatch && dynamicMatch[1]) {
        const paramName = dynamicMatch[1];
        keys.push({ name: paramName, optional: false, catchAll: false });
        return "/([^/]+)";
      }

      // Static segment
      if (segment) {
        return "/" + segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      return "";
    })
    .join("");

  // Handle root route
  if (regexPattern === "") {
    regexPattern = "/";
  }

  // Create regex with exact match
  const regex = new RegExp(`^${regexPattern}$`);

  return {
    pattern: normalizedRoute,
    regex,
    keys,
  };
}

/**
 * Matches a pathname against a route pattern
 * @param pathname - The pathname to match (e.g., "/blog/hello-world")
 * @param routePattern - The route pattern (e.g., "/blog/[slug]")
 * @returns RouteMatch object if matched, null otherwise
 */
export function matchRoute(
  pathname: string,
  routePattern: string | RoutePattern
): RouteMatch | null {
  const compiled =
    typeof routePattern === "string"
      ? compileRoute(routePattern)
      : routePattern;

  // Normalize pathname
  let normalizedPathname = pathname;
  if (!normalizedPathname.startsWith("/")) {
    normalizedPathname = "/" + normalizedPathname;
  }
  if (normalizedPathname !== "/" && normalizedPathname.endsWith("/")) {
    normalizedPathname = normalizedPathname.slice(0, -1);
  }

  const match = normalizedPathname.match(compiled.regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string | string[]> = {};

  // Extract parameter values
  compiled.keys.forEach((key, index) => {
    const value = match[index + 1];

    if (key.catchAll) {
      if (value) {
        // Split catch-all into array, filtering empty strings
        params[key.name] = value.split("/").filter(Boolean);
      } else if (key.optional) {
        params[key.name] = [];
      }
    } else if (value !== undefined) {
      params[key.name] = value;
    }
  });

  return {
    params,
    route: compiled.pattern,
  };
}

/**
 * Finds the first matching route from a list of route patterns
 * @param pathname - The pathname to match
 * @param routes - Array of route patterns to try
 * @returns RouteMatch object with the matched route, or null
 */
export function matchRoutes(
  pathname: string,
  routes: string[]
): RouteMatch | null {
  for (const route of routes) {
    const match = matchRoute(pathname, route);
    if (match) {
      return match;
    }
  }
  return null;
}

/**
 * Creates a route matcher function that can be reused for multiple pathname matches
 * @param routes - Array of route patterns
 * @returns A function that matches pathnames against the compiled routes
 */
export function createRouteMatcher(routes: string[]) {
  const compiledRoutes = routes.map((route) => compileRoute(route));

  return (pathname: string): RouteMatch | null => {
    for (const compiled of compiledRoutes) {
      const match = matchRoute(pathname, compiled);
      if (match) {
        return match;
      }
    }
    return null;
  };
}

/**
 * Generates a pathname from a route pattern and params
 * @param route - The route pattern (e.g., "/blog/[slug]")
 * @param params - The parameters to fill in
 * @returns The generated pathname
 */
export function generatePath(
  route: string,
  params: Record<string, string | string[] | number>
): string {
  let path = route;

  // Replace optional catch-all: [[...param]]
  path = path.replace(/\[\[\.\.\.([^\]]+)\]\]/g, (_, paramName) => {
    const value = params[paramName];
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join("/") : "";
    }
    return value ? String(value) : "";
  });

  // Replace catch-all: [...param]
  path = path.replace(/\[\.\.\.([^\]]+)\]/g, (_, paramName) => {
    const value = params[paramName];
    if (Array.isArray(value)) {
      return value.join("/");
    }
    return String(value);
  });

  // Replace dynamic parameters: [param]
  path = path.replace(/\[([^\]]+)\]/g, (_, paramName) => {
    const value = params[paramName];
    return String(value);
  });

  // Clean up double slashes
  path = path.replace(/\/+/g, "/");

  // Ensure it starts with /
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return path;
}

/**
 * Sorts routes by specificity (most specific first)
 * Static routes > Dynamic routes > Catch-all routes
 * @param routes - Array of route patterns to sort
 * @returns Sorted array of route patterns
 */
export function sortRoutesBySpecificity(routes: string[]): string[] {
  return routes.slice().sort((a, b) => {
    const scoreA = getRouteSpecificity(a);
    const scoreB = getRouteSpecificity(b);
    return scoreB - scoreA; // Higher score = more specific
  });
}

function getRouteSpecificity(route: string): number {
  let score = 0;
  const segments = route.split("/").filter(Boolean);

  for (const segment of segments) {
    if (segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/)) {
      // Optional catch-all: lowest priority
      score += 1;
    } else if (segment.match(/^\[\.\.\.([^\]]+)\]$/)) {
      // Catch-all: low priority
      score += 2;
    } else if (segment.match(/^\[([^\]]+)\]$/)) {
      // Dynamic: medium priority
      score += 10;
    } else {
      // Static: highest priority
      score += 100;
    }
  }

  return score;
}

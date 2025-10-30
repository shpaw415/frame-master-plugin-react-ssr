import type { masterRequest } from "frame-master/server/request";

export function join(...parts: string[]) {
  return parts
    .map((part, index) => {
      // Normalize backslashes to forward slashes
      part = part.replace(/\\/g, "/");

      if (index === 0) {
        // First part: remove trailing slashes only
        return part.replace(/\/+$/g, "");
      } else if (index === parts.length - 1) {
        // Last part: remove leading slashes only (preserve filenames like index.js)
        return part.replace(/^\/+/g, "");
      } else {
        // Middle parts: remove both leading and trailing slashes
        return part.replace(/^\/+|\/+$/g, "");
      }
    })
    .filter((part) => part.length > 0)
    .join("/");
}

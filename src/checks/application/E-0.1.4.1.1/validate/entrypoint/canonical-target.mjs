import { isAbsolute, win32 } from "node:path";

export function inspectEntrypointTarget(target) {
  if (
    typeof target !== "string" ||
    !target.trim() ||
    isAbsolute(target) ||
    win32.isAbsolute(target)
  )
    return { error: "relative" };
  const path = target.replaceAll("\\", "/").replace(/^\.\//u, "");
  const segments = path.split("/");
  if (
    !path.startsWith("bin/") ||
    segments.some(
      (segment) => !segment || segment === "." || segment === ".." || segment.includes(":"),
    )
  )
    return { error: "canonical" };
  return { path };
}

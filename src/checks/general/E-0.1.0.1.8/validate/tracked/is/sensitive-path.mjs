import { isEnvironmentFile } from "./environment-file.mjs";
import { isProtectedComponent } from "./protected-component.mjs";

export function isSensitivePath(path) {
  const parts = path.replaceAll("\\", "/").split("/");
  return parts.some((part) => isEnvironmentFile(part) || isProtectedComponent(part));
}

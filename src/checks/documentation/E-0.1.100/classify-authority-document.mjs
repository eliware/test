import { basename } from "node:path";

export function classifyAuthorityDocument(relativeFile, document) {
  const normalizedPath = relativeFile.replaceAll("\\", "/");
  const name = basename(relativeFile);
  if (name === "authority-map.json") {
    const isSchema =
      typeof document?.requiredPath === "string" &&
      document?.requiredFields &&
      typeof document.requiredFields === "object";
    return isSchema ? null : "map";
  }
  return normalizedPath.endsWith("specs/authority.json") ? "record" : null;
}

import { access } from "node:fs/promises";
import { extname, join } from "node:path";

export async function resolveFocusedCoverage(root, focusedPath) {
  if (!focusedPath) return [];
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  const marker = normalized.match(/^(?:tests?|specs?)\/(.*)$/i);
  if (!marker || !/\.(?:test|spec)\.[^.]+$/i.test(marker[1])) return [];
  const sourceBase = marker[1].replace(/\.(?:test|spec)(?=\.[^.]+$)/i, "");
  const extension = extname(sourceBase);
  const sourceRelative = `src/${sourceBase.slice(0, -extension.length)}${extension}`;
  const sourcePath = join(root, ...sourceRelative.split("/"));
  try {
    await access(sourcePath);
    return ["--collectCoverageFrom", sourceRelative.replaceAll("\\", "/")];
  } catch {
    return [];
  }
}

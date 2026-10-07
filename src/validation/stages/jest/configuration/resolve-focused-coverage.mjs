import { access } from "node:fs/promises";
import { extname, join } from "node:path";
import { mapFocusedSourceExtension } from "./map-focused-source-extension.mjs";

export async function resolveFocusedCoverage(root, focusedPath) {
  if (!focusedPath) return [];
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  // Root matching is case-insensitive because focused-path validation accepts those paths on Windows.
  const marker = normalized.match(/^tests?\/(.*)$/i);
  if (!marker || !/\.(?:test|spec)\.[^.]+$/i.test(marker[1])) return [];
  const sourceBase = marker[1].replace(/\.(?:test|spec)(?=\.[^.]+$)/i, "");
  const extension = extname(sourceBase);
  const sourceRelative = `src/${sourceBase.slice(0, -extension.length)}${mapFocusedSourceExtension(extension)}`;
  const sourcePath = join(root, ...sourceRelative.split("/"));
  try {
    await access(sourcePath);
    return ["--collectCoverageFrom", sourceRelative.replaceAll("\\", "/")];
  } catch {
    throw new Error(`Focused test has no mirrored source file: ${sourceRelative}.`);
  }
}

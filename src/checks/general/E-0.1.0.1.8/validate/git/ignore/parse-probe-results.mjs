import { relative, resolve } from "node:path";
import { requiredIgnoreCases } from "../../ignore-patterns.mjs";

export function parseGitIgnoreProbeResults(output, root) {
  return new Set(output.split(/\r?\n/u).flatMap((line) => parseIgnoredPath(line, root)));
}

function parseIgnoredPath(line, root) {
  const separator = line.indexOf("\t");
  if (separator < 0) return [];
  const match = /^(.*):[1-9]\d*:([^\t]+)$/u.exec(line.slice(0, separator));
  if (!match) return [];
  const [, source] = match;
  const sourcePath = resolve(root, source);
  const requiredSource = resolve(root, ".gitignore");
  if (relative(sourcePath, requiredSource) !== "") return [];
  const path = line.slice(separator + 1);
  const required = requiredIgnoreCases.find(([requiredPath]) => requiredPath === path);
  return required ? [path] : [];
}

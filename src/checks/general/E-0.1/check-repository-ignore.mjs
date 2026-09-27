import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { minimatch } from "minimatch";

export async function isIgnoredByRepositoryRules(root, path) {
  let lines;
  try {
    lines = (await readFile(join(root, ".gitignore"), "utf8")).split(/\r?\n/u);
  } catch {
    return false;
  }
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//u, "");
  let ignored = false;
  for (let pattern of lines) {
    pattern = pattern.trim();
    if (!pattern || pattern.startsWith("#")) continue;
    const negated = pattern.startsWith("!");
    if (negated) pattern = pattern.slice(1);
    pattern = pattern.replace(/^\//u, "").replace(/\/$/u, "");
    const matches = [
      normalized,
      ...normalized
        .split("/")
        .slice(0, -1)
        .map((_, index, parts) => parts.slice(0, index + 1).join("/")),
    ].some((candidate) =>
      minimatch(candidate, pattern, { dot: true, matchBase: !pattern.includes("/") }),
    );
    if (matches) ignored = !negated;
  }
  return ignored;
}

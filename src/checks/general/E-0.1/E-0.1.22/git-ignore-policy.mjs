import { minimatch } from "minimatch";

export function hasExplicitIgnoreRule(ignoreText, path) {
  const normalized = path.replaceAll("\\", "/");
  const candidates = [
    normalized,
    ...normalized
      .split("/")
      .slice(0, -1)
      .map((_, index, parts) => parts.slice(0, index + 1).join("/")),
  ];
  return ignoreText.split(/\r?\n/u).some((line) => {
    let pattern = line.trim().replaceAll("\\", "/");
    if (!pattern || pattern.startsWith("#") || pattern.startsWith("!")) return false;
    pattern = pattern.replace(/^\//u, "").replace(/\/$/u, "");
    return candidates.some((candidate) =>
      minimatch(candidate, pattern, { dot: true, matchBase: !pattern.includes("/") }),
    );
  });
}

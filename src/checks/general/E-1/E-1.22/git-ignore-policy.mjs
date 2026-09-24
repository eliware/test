export function prohibitedTrackedPath(path) {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/");
  const basename = segments.at(-1);
  return (
    basename === ".env" ||
    (basename.startsWith(".env.") && basename !== ".env.example") ||
    segments.includes("node_modules") ||
    segments.includes(".git") ||
    segments.includes("coverage") ||
    segments.includes("dist") ||
    segments.includes("build") ||
    segments.includes(".cache") ||
    segments.includes(".vscode") ||
    segments.includes(".idea") ||
    normalized.endsWith(".pem") ||
    normalized.endsWith(".key")
  );
}

export function hasExplicitIgnoreRule(ignoreText, path) {
  const normalized = path.replaceAll("\\", "/");
  const first = normalized.split("/")[0];
  if (first.startsWith(".env")) return /(?:^|\r?\n)\s*\.env(?:\*|\b)/u.test(ignoreText);
  const escapedFirst = first.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`(?:^|\\r?\\n)\\s*(?:[/\\\\])?${escapedFirst}(?:[/\\\\]|\\s|$)`, "u").test(
    ignoreText,
  );
}

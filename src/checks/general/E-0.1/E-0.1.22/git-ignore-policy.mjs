export function hasExplicitIgnoreRule(ignoreText, path) {
  const normalized = path.replaceAll("\\", "/");
  const first = normalized.split("/")[0];
  if (first.startsWith(".env")) return /(?:^|\r?\n)\s*\.env(?:\*|\b)/u.test(ignoreText);
  const escapedFirst = first.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`(?:^|\\r?\\n)\\s*(?:[/\\\\])?${escapedFirst}(?:[/\\\\]|\\s|$)`, "u").test(
    ignoreText,
  );
}

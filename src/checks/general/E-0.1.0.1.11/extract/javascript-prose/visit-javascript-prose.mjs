const ignoredKeys = new Set(["loc", "start", "end", "extra", "comments", "tokens"]);

export function visitJavaScriptProse(value, visit) {
  if (!value || typeof value !== "object") return;
  if (visit(value) === false) return;
  for (const [key, child] of Object.entries(value)) {
    if (ignoredKeys.has(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visitJavaScriptProse(item, visit));
    else visitJavaScriptProse(child, visit);
  }
}

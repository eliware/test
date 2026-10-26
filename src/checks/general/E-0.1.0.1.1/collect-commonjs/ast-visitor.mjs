export function visitCommonJsAst(root, visit) {
  if (!root || typeof root !== "object") return;
  visit(root);
  for (const [key, value] of Object.entries(root)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => visitCommonJsAst(child, visit));
    else if (value && typeof value === "object") visitCommonJsAst(value, visit);
  }
}

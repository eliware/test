export function visitAst(node, callback) {
  if (!node || typeof node !== "object") return;
  callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visitAst(child, callback));
    else if (value && typeof value === "object") visitAst(value, callback);
  }
}

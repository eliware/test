export function visitAst(node, callback) {
  if (!node || typeof node !== "object") return false;
  if (callback(node)) return true;
  return Object.values(node).some((value) =>
    Array.isArray(value)
      ? value.some((child) => visitAst(child, callback))
      : visitAst(value, callback),
  );
}

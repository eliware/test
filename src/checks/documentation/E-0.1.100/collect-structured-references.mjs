export function collectStructuredReferences(document) {
  const references = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (!Array.isArray(value) && typeof value.path === "string") {
      references.push(value.path);
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(document);
  return references;
}

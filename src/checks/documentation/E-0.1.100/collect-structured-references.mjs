export function collectStructuredReferences(document) {
  const references = [];
  const visit = (value, crossRepository = false) => {
    if (!value || typeof value !== "object") return;
    if (!Array.isArray(value) && typeof value.path === "string") {
      references.push({ path: value.path, crossRepository });
    }
    for (const [key, child] of Object.entries(value)) {
      visit(child, crossRepository || key === "crosslinks");
    }
  };
  visit(document);
  return references;
}

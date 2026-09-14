function addReference(references, value, file, field, external = false) {
  if (typeof value === "string") references.push({ value, file, field, external });
  else if (Array.isArray(value)) {
    value.forEach((item) => addReference(references, item, file, field, external));
  }
}

export function collectStructuredReferences(document, file) {
  const references = [];
  const visit = (value, parentKey = "") => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, parentKey));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === "crosslinks" && Array.isArray(child)) {
        child.forEach((link, index) => {
          if (!link || typeof link !== "object" || typeof link.path !== "string") {
            references.push({
              error: `crosslinks[${index}] must be an object with a path`,
              file,
              field: key,
            });
          }
        });
      }
      if (key === "path" && typeof child === "string") {
        addReference(references, child, file, key, parentKey === "crosslinks");
      }
      if (key === "globalAuthorityMap") addReference(references, child, file, key, true);
      if (
        ["implementation", "verification", "evidence"].includes(parentKey) &&
        ["source", "tests", "files", "documents", "references"].includes(key)
      ) {
        addReference(references, child, file, `${parentKey}.${key}`);
      }
      visit(child, key);
    }
  };
  visit(document);
  return references;
}

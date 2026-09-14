export function collectRegisteredExternalReferences(document) {
  const registered = new Set();
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (Array.isArray(value.crosslinks)) {
      value.crosslinks.forEach((link) => {
        if (link && typeof link.path === "string") registered.add(link.path);
      });
    }
    Object.values(value).forEach(visit);
  };
  visit(document);
  return registered;
}

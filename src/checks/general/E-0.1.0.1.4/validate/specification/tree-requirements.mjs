export function validateSpecificationTreeRequirements(entries) {
  const errors = entries
    .filter((entry) => entry.type === "unsupported")
    .map(({ path }) => `${path} is an unsupported filesystem entry under specs/.`);
  if (!entries.some((entry) => entry.type === "file" && entry.path === "specs/directives.yaml"))
    errors.push("specs/directives.yaml is required.");
  return errors;
}

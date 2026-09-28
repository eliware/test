export function validatePackageAuthorityMetadata(eliware) {
  const failures = [];
  if (
    !Array.isArray(eliware?.authority?.authoritativeFor) ||
    eliware.authority.authoritativeFor.length === 0 ||
    eliware.authority.authoritativeFor.some(
      (value) => typeof value !== "string" || !value.trim(),
    ) ||
    !Array.isArray(eliware.authority.notAuthoritativeFor) ||
    eliware.authority.notAuthoritativeFor.length === 0 ||
    eliware.authority.notAuthoritativeFor.some(
      (value) => typeof value !== "string" || !value.trim(),
    )
  )
    failures.push(
      "package.json.eliware.authority must contain nonempty authoritativeFor and notAuthoritativeFor arrays.",
    );
  if (
    !Array.isArray(eliware.crosslinks) ||
    eliware.crosslinks.length === 0 ||
    eliware.crosslinks.some(
      (link) =>
        !link ||
        typeof link !== "object" ||
        typeof link.path !== "string" ||
        !link.path.trim() ||
        typeof link.relation !== "string" ||
        !link.relation.trim() ||
        typeof link.authoritativeFor !== "string" ||
        !link.authoritativeFor.trim(),
    )
  )
    failures.push(
      "package.json.eliware.crosslinks must contain path, relation, and authoritativeFor for every link.",
    );
  return failures.length ? failures.join("\n") : null;
}

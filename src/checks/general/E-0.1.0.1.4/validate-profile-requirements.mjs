export function validateProfileRequirements(value, path, documents) {
  if (!path.startsWith("specs/conventions/")) return [];
  const profile = /\/([^/]+)-(?:semantic|deterministic)\.ya?ml(?: document \d+)?$/u.exec(path)?.[1];
  if (!profile) return [];
  const profileDocuments = documents.flatMap(({ path: candidate, value: document }) => {
    const match = /\/([^/]+)-(?:semantic|deterministic)\.ya?ml(?: document \d+)?$/u.exec(candidate);
    return match ? [{ profile: match[1], document, path: candidate }] : [];
  });
  const profiles = new Set(profileDocuments.map(({ profile: name }) => name));
  const errors = [];
  for (const field of ["requires", "conflicts"]) {
    const names = value?.[field];
    if (!Array.isArray(names)) {
      errors.push(`${path}.${field} must list valid profile names.`);
      continue;
    }
    if (new Set(names).size !== names.length)
      errors.push(`${path}.${field} must not contain duplicate profiles.`);
    if (names.includes(profile)) errors.push(`${path}.${field} must not include its own profile.`);
    const unknown = names.filter((name) => !profiles.has(name));
    if (unknown.length)
      errors.push(`${path}.${field} names unknown profiles: ${unknown.join(", ")}.`);
    // codescope ignore this because prerequisites are directional; only conflicts require reciprocal declarations.
    if (field === "conflicts") {
      for (const name of names.filter((candidate) => profiles.has(candidate))) {
        const targets = profileDocuments.filter(({ profile: target }) => target === name);
        if (targets.some(({ document }) => !document?.conflicts?.includes(profile)))
          errors.push(`${path}.conflicts must be declared by ${name}.`);
      }
    }
  }
  return errors;
}

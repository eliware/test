export function readProfileComposition(document, source, profile) {
  const composition = { requires: document.requires, conflicts: document.conflicts };
  for (const [field, names] of Object.entries(composition)) {
    if (
      !Array.isArray(names) ||
      names.some((name) => typeof name !== "string" || !/^[a-z0-9-]+$/u.test(name)) ||
      new Set(names).size !== names.length ||
      names.includes(profile)
    )
      throw new Error(`Bundled convention profile ${source} has an invalid ${field} list.`);
  }
  return composition;
}

export function validateProfileComposition(profiles) {
  for (const [profile, metadata] of Object.entries(profiles)) {
    for (const field of ["requires", "conflicts"]) {
      const names = metadata[field];
      const unknown = names.filter((name) => !profiles[name]);
      if (unknown.length) {
        const relationship = field === "requires" ? "requires" : "conflicts with";
        throw new Error(
          `Bundled convention profile ${profile} ${relationship} unknown profiles: ${unknown.join(", ")}.`,
        );
      }
    }
    const asymmetric = metadata.conflicts.filter(
      (conflict) => !profiles[conflict].conflicts.includes(profile),
    );
    if (asymmetric.length)
      throw new Error(
        `Bundled convention profile ${profile} has asymmetric conflicts: ${asymmetric.join(", ")}.`,
      );
  }
}

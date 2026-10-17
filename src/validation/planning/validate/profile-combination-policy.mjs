const profileName = /^[a-z0-9-]+$/u;

export function validateProfileCombinationPolicy(policy, knownProfiles, expectedVersion) {
  const errors = [];
  if (!policy || typeof policy !== "object" || Array.isArray(policy))
    return ["specs/conventions/ordering/profile-combinations.yaml must contain an object."];
  if (policy.version !== expectedVersion)
    errors.push(
      "specs/conventions/ordering/profile-combinations.yaml must use the current convention version.",
    );
  if (Object.keys(policy).some((field) => !["version", "profiles"].includes(field)))
    errors.push(
      "specs/conventions/ordering/profile-combinations.yaml contains unsupported fields.",
    );
  if (!policy.profiles || typeof policy.profiles !== "object" || Array.isArray(policy.profiles))
    return [
      ...errors,
      "specs/conventions/ordering/profile-combinations.yaml must define profiles.",
    ];

  const declaredProfiles = Object.keys(policy.profiles);
  const missing = knownProfiles.filter((profile) => !declaredProfiles.includes(profile));
  const unknown = declaredProfiles.filter((profile) => !knownProfiles.includes(profile));
  if (missing.length) errors.push(`Profile policy omits profiles: ${missing.join(", ")}.`);
  if (unknown.length) errors.push(`Profile policy names unknown profiles: ${unknown.join(", ")}.`);

  for (const [profile, values] of Object.entries(policy.profiles)) {
    if (
      !profileName.test(profile) ||
      !values ||
      typeof values !== "object" ||
      Array.isArray(values)
    ) {
      errors.push(`Profile policy has an invalid entry for ${profile}.`);
      continue;
    }
    validateProfileLists(profile, values, declaredProfiles, errors);
  }
  return errors;
}

function validateProfileLists(profile, values, declaredProfiles, errors) {
  for (const field of ["requires", "requiresAny", "prohibits"]) {
    const names = values[field];
    if (
      !Array.isArray(names) ||
      names.some((name) => typeof name !== "string" || !profileName.test(name)) ||
      new Set(names).size !== names.length
    ) {
      errors.push(`Profile policy ${profile}.${field} must be a valid profile list.`);
      continue;
    }
    const unknown = names.filter((name) => !declaredProfiles.includes(name));
    if (unknown.length)
      errors.push(
        `Profile policy ${profile}.${field} names unknown profiles: ${unknown.join(", ")}.`,
      );
    if (names.includes(profile))
      errors.push(`Profile policy ${profile}.${field} cannot name itself.`);
  }
  if (
    Object.keys(values).some((field) => !["requires", "requiresAny", "prohibits"].includes(field))
  )
    errors.push(`Profile policy ${profile} contains unsupported fields.`);
  if (["requires", "requiresAny", "prohibits"].some((field) => !Object.hasOwn(values, field)))
    errors.push(`Profile policy ${profile} must define requires, requiresAny, and prohibits.`);
  if (Array.isArray(values.requires) && Array.isArray(values.prohibits)) {
    const overlap = values.requires.filter((name) => values.prohibits.includes(name));
    if (overlap.length)
      errors.push(`Profile policy ${profile} both requires and prohibits ${overlap.join(", ")}.`);
  }
}

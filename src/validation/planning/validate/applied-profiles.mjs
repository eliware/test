import { readCanonicalOrder } from "../../shared/conventions/read-canonical-order.mjs";

export function validateAppliedProfiles(
  apply,
  policy,
  canonicalProfileOrder = readCanonicalOrder("eliware-apply.yaml").profiles,
) {
  const unknown = apply.filter((name) => !policy.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (!apply.includes("general")) return "Each repository must explicitly apply general.";
  const ordered = [...apply].sort(
    (left, right) => canonicalProfileOrder.indexOf(left) - canonicalProfileOrder.indexOf(right),
  );
  if (apply.some((profile, index) => profile !== ordered[index]))
    return "Applied profiles must use the canonical order.";
  const missing = apply.flatMap((profile) =>
    policy.profiles[profile].requires.filter((required) => !apply.includes(required)),
  );
  if (missing.length > 0)
    return `Applied profiles require explicit profiles: ${[...new Set(missing)].join(", ")}.`;
  const unsatisfiedAlternatives = apply.filter((profile) => {
    const alternatives = policy.profiles[profile].requiresAny;
    return alternatives.length > 0 && !alternatives.some((name) => apply.includes(name));
  });
  if (unsatisfiedAlternatives.length > 0) {
    const names = unsatisfiedAlternatives.flatMap(
      (profile) => policy.profiles[profile].requiresAny,
    );
    return `Applied profiles require at least one of: ${[...new Set(names)].join(", ")}.`;
  }
  const conflicts = new Set();
  for (const profile of apply) {
    for (const prohibited of policy.profiles[profile].prohibits) {
      if (!apply.includes(prohibited)) continue;
      const pair =
        apply.indexOf(profile) < apply.indexOf(prohibited)
          ? `${profile} and ${prohibited}`
          : `${prohibited} and ${profile}`;
      conflicts.add(pair);
    }
  }
  if (conflicts.size > 0) return `Applied profiles conflict: ${[...conflicts].join(", ")}.`;
  return null;
}

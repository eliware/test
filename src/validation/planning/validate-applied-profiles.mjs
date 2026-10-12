import { readBundledProfileCatalog } from "../check-discovery/read-bundled-profile-catalog.mjs";
import { readCanonicalOrder } from "../shared/conventions/read-canonical-order.mjs";

export function validateAppliedProfiles(apply, catalog = readBundledProfileCatalog()) {
  const unknown = apply.filter((name) => !catalog.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (!apply.includes("general")) return "Every repository must explicitly apply general.";
  const canonicalProfileOrder = readCanonicalOrder("eliware-apply.yaml").profiles;
  const ordered = [...apply].sort(
    (left, right) => canonicalProfileOrder.indexOf(left) - canonicalProfileOrder.indexOf(right),
  );
  if (apply.some((profile, index) => profile !== ordered[index]))
    return "Applied profiles must use the canonical order.";
  const missing = apply.flatMap((profile) =>
    catalog.profiles[profile].requires.filter((required) => !apply.includes(required)),
  );
  if (missing.length > 0)
    return `Applied profiles require explicit profiles: ${[...new Set(missing)].join(", ")}.`;
  const conflicts = apply.flatMap((profile) =>
    catalog.profiles[profile].conflicts
      .filter(
        (conflict) => apply.includes(conflict) && apply.indexOf(profile) < apply.indexOf(conflict),
      )
      .map((conflict) => `${profile} and ${conflict}`),
  );
  if (conflicts.length > 0) return `Applied profiles conflict: ${conflicts.join(", ")}.`;
  return null;
}

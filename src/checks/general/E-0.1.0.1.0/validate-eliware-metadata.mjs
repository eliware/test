import { readBundledProfileCatalog } from "../../../validation/check-discovery/read-bundled-profile-catalog.mjs";
import { validateAppliedProfiles } from "../../../validation/planning/validate-applied-profiles.mjs";
import { validateExemptionRecords } from "../../../validation/planning/validate-exemption-records.mjs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateEliwareMetadata(packageJson) {
  const eliware = packageJson?.eliware;
  const errors = [];
  const canonicalKeys = readCanonicalOrder("package-json.yaml").eliwareKeys;
  const keys = eliware && typeof eliware === "object" ? Object.keys(eliware) : [];
  const expectedKeys = canonicalKeys.filter((key) => key !== "exempt");
  if (Object.hasOwn(eliware ?? {}, "exempt")) expectedKeys.push("exempt");
  if (
    !eliware ||
    typeof eliware !== "object" ||
    Array.isArray(eliware) ||
    keys.join(",") !== expectedKeys.join(",")
  )
    errors.push("package.json.eliware must use the ordered keys id, apply, and optional exempt.");
  if (typeof eliware?.id !== "string" || !/^E-\d+$/u.test(eliware.id))
    errors.push("package.json.eliware.id must be an assigned repository E-number.");
  const apply = eliware?.apply;
  if (
    !Array.isArray(apply) ||
    apply.length === 0 ||
    apply.some((name) => typeof name !== "string")
  ) {
    errors.push("package.json.eliware.apply must be a nonempty array of profile names.");
  } else {
    if (new Set(apply).size !== apply.length)
      errors.push("package.json.eliware.apply must not contain duplicate profile names.");
    const failure = validateAppliedProfiles(apply, readBundledProfileCatalog());
    if (failure) errors.push(failure);
  }
  if (eliware && Object.hasOwn(eliware, "exempt")) {
    try {
      validateExemptionRecords(
        eliware.exempt,
        Object.keys(readBundledProfileCatalog().deterministicDirectives),
      );
    } catch (error) {
      errors.push(error.message);
    }
  }
  return errors;
}

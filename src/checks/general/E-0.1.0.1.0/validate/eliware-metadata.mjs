import { readBundledProfileCatalog } from "../../../../validation/check-discovery/read/bundled-profile-catalog.mjs";
import { validateExemptionRecords } from "../../../../validation/planning/validate/exemption/records.mjs";
import { readCanonicalOrder } from "../../../../validation/shared/conventions/read-canonical-order.mjs";

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
    errors.push("package.json.eliware must use the ordered keys id, apply, and optional `exempt`.");
  if (typeof eliware?.id !== "string" || !/^E-\d+$/u.test(eliware.id))
    errors.push("package.json.eliware.id must be an assigned repository E-number.");
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

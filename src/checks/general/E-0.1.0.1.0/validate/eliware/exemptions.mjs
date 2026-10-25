import { readBundledProfileCatalog } from "../../../../../validation/check-discovery/read/bundled-profile-catalog.mjs";
import { validateExemptionRecords } from "../../../../../validation/planning/validate/exemption/records.mjs";

export function validateEliwareExemptions(eliware) {
  if (!eliware || !Object.hasOwn(eliware, "exempt")) return [];
  try {
    validateExemptionRecords(
      eliware.exempt,
      Object.keys(readBundledProfileCatalog().deterministicDirectives),
    );
    return [];
  } catch (error) {
    return [error.message];
  }
}

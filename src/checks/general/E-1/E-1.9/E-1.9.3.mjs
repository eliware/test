import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "E-1.9.3";
export const parentRuleId = "E-1.9";

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(`${value}T`);
}

function validTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function run({ packageJson }) {
  const exemptions = packageJson?.eliware?.exempt ?? [];
  if (!Array.isArray(exemptions))
    return fail(ruleId, "package.json.eliware.exempt must be an array.");
  for (const exemption of exemptions) {
    if (
      !exemption ||
      typeof exemption.ruleId !== "string" ||
      !exemption.ruleId.trim() ||
      typeof exemption.reason !== "string" ||
      !exemption.reason.trim() ||
      exemption.approver !== "Eli" ||
      typeof exemption.approvalTimestamp !== "string" ||
      !validTimestamp(exemption.approvalTimestamp) ||
      (exemption.expiry !== null &&
        (typeof exemption.expiry !== "string" || !validDate(exemption.expiry) ||
          Date.parse(`${exemption.expiry}T23:59:59.999Z`) < Date.now()))
    ) {
      return fail(
        ruleId,
        "Every exemption must identify a rule ID, reason, approver, approval timestamp, and valid expiry.",
      );
    }
  }
  return pass(ruleId);
}

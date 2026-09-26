export function validatePackageExemptions(exemptions) {
  if (Array.isArray(exemptions) && exemptions.some((exemption) => !exemption || typeof exemption !== "object" || typeof exemption.ruleId !== "string" || !exemption.ruleId.trim() || typeof exemption.reason !== "string" || !exemption.reason.trim() || exemption.approver !== "Eli" || typeof exemption.approvalTimestamp !== "string" || !exemption.approvalTimestamp.trim() || !(exemption.expiry === null || typeof exemption.expiry === "string"))) return "package.json.eliware.exempt entries must contain valid ruleId, reason, Eli approval, approvalTimestamp, and expiry fields.";
  return null;
}

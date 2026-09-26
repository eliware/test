function isValidTimestamp(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isValidExpiry(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T23:59:59.999Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(`${value}T`) && date.valueOf() >= Date.now();
}

export function isValidSensitiveExemption(entry) {
  return Boolean(
    entry &&
      typeof entry.path === "string" &&
      entry.path.trim().length > 0 &&
      !entry.path.includes("*") &&
      typeof entry.reason === "string" &&
      entry.reason.trim().length > 0 &&
      entry.approver === "Eli" &&
      isValidTimestamp(entry.approvalTimestamp) &&
      isValidExpiry(entry.expiry),
  );
}

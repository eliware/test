export function validateExemptionRecords(records) {
  if (
    !Array.isArray(records) ||
    records.some((entry) => {
      return (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.ruleId !== "string" ||
        !entry.ruleId.trim() ||
        typeof entry.reason !== "string" ||
        !entry.reason.trim() ||
        entry.approver !== "Eli" ||
        typeof entry.approvalTimestamp !== "string" ||
        !isValidTimestamp(entry.approvalTimestamp) ||
        (entry.expiry !== null && typeof entry.expiry !== "string") ||
        (typeof entry.expiry === "string" &&
          (!isValidDate(entry.expiry) || isExpired(entry.expiry)))
      );
    })
  ) {
    throw new Error(
      "Every exemption must identify a ruleId, reason, approver, approvalTimestamp, and expiry.",
    );
  }
  const ids = records.map(({ ruleId }) => ruleId);
  if (new Set(ids).size !== ids.length)
    throw new Error("Convention exemption rule IDs must be unique.");
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(`${value}T`);
}

function isValidTimestamp(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  ) {
    return false;
  }
  const date = new Date(value);
  const datePart = value.slice(0, 10);
  const calendarDate = new Date(`${datePart}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && calendarDate.toISOString().slice(0, 10) === datePart;
}

function isExpired(value) {
  return Date.parse(`${value}T23:59:59.999Z`) < Date.now();
}

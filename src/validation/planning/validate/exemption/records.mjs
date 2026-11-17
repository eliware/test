export function validateExemptionRecords(records, knownRuleIds) {
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
          (!isValidDate(entry.expiry) || isExpired(entry.expiry))) ||
        (entry.paths !== undefined &&
          (!Array.isArray(entry.paths) ||
            entry.paths.some((path) => !isValidRepositoryPath(path)) ||
            new Set(entry.paths).size !== entry.paths.length)) ||
        !isValidAdvisoryExemption(entry)
      );
    })
  ) {
    throw new Error(
      "Every exemption must identify a ruleId, cause, approver, approvalTimestamp, and expiry.",
    );
  }
  const ids = records.map(({ ruleId }) => ruleId);
  if (new Set(ids).size !== ids.length)
    throw new Error("Convention exemption rule IDs must be unique.");
  if (knownRuleIds && ids.some((id) => !knownRuleIds.includes(id)))
    throw new Error("Every convention exemption must identify a known rule ID.");
}

function isValidAdvisoryExemption(entry) {
  if (entry.ruleId !== "stage:audit") return entry.advisories === undefined;
  return (
    Array.isArray(entry.advisories) &&
    entry.advisories.length > 0 &&
    entry.advisories.every((advisory) =>
      /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/u.test(advisory),
    ) &&
    new Set(entry.advisories).size === entry.advisories.length &&
    entry.paths === undefined
  );
}

function isValidRepositoryPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..") &&
    !/^[A-Za-z]:/u.test(value)
  );
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

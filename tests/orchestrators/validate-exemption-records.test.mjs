import { expect, test } from "@jest/globals";
import { validateExemptionRecords } from "../../src/orchestrators/validate-exemption-records.mjs";

const record = (overrides = {}) => ({
  ruleId: "E-1.20.10",
  reason: "Temporary migration exception.",
  approver: "Eli",
  approvalTimestamp: "2026-09-13T00:00:00Z",
  expiry: "2026-09-30",
  ...overrides,
});

test("accepts valid temporary and permanent exemptions", () => {
  expect(() =>
    validateExemptionRecords([record({ review: "2026-09-20" }), record({ ruleId: "E-1.3", expiry: null })]),
  ).not.toThrow();
});

test("rejects malformed records and invalid expiry dates", () => {
  expect(() => validateExemptionRecords([record({ reason: "" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "not-a-date" })])).toThrow();
  expect(() => validateExemptionRecords([record({ approvalTimestamp: "" })])).toThrow();
  expect(() => validateExemptionRecords([record({ approvalTimestamp: "not-a-timestamp" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "2020-01-01" })])).toThrow();
});

test("rejects duplicate exemption rule IDs", () => {
  expect(() => validateExemptionRecords([record({ review: "2026-09-20" }), record({ review: "2026-09-20" })])).toThrow("must be unique");
});

test.each(["random-user", "eli", "Eliware", ""]) (
  "rejects non-Eli approver %j",
  (approver) => {
    expect(() => validateExemptionRecords([record({ approver })])).toThrow();
  },
);

test("requires temporary reviews no later than expiry and rejects permanent reviews", () => {
  expect(() => validateExemptionRecords([record({ review: "2026-09-20" })])).not.toThrow();
  expect(() => validateExemptionRecords([record({ review: "2026-10-01" })])).toThrow();
  expect(() => validateExemptionRecords([record({ review: "fixture" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: null, review: "2026-09-20" })])).toThrow();
});

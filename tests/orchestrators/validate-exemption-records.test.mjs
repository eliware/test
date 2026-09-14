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
    validateExemptionRecords([record(), record({ ruleId: "E-1.3", expiry: null })]),
  ).not.toThrow();
});

test("rejects malformed records and invalid expiry dates", () => {
  expect(() => validateExemptionRecords([record({ reason: "" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "not-a-date" })])).toThrow();
  expect(() => validateExemptionRecords([record({ approvalTimestamp: "" })])).toThrow();
});

test("rejects duplicate exemption rule IDs", () => {
  expect(() => validateExemptionRecords([record(), record()])).toThrow("must be unique");
});

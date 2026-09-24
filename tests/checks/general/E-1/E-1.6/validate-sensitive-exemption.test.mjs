import { expect, test } from "@jest/globals";
import { isValidSensitiveExemption } from "../../../../../src/checks/general/E-1/E-1.6/validate-sensitive-exemption.mjs";

const valid = {
  path: "credentials.json",
  reason: "approved fixture",
  approver: "Eli",
  approvalTimestamp: "2026-09-24T00:00:00Z",
  expiry: null,
};

test("accepts an exact, approved, unexpired sensitive-path exemption", () => {
  expect(isValidSensitiveExemption(valid)).toBe(true);
  expect(isValidSensitiveExemption({ ...valid, expiry: "2099-12-31" })).toBe(true);
});

test("rejects malformed path and approval fields", () => {
  for (const entry of [null, {}, { ...valid, path: " " }, { ...valid, path: "secret*.json" },
    { ...valid, reason: " " }, { ...valid, approver: "Other" },
    { ...valid, approvalTimestamp: "not a timestamp" }]) {
    expect(isValidSensitiveExemption(entry)).toBe(false);
  }
});

test("rejects invalid, malformed, and expired dates", () => {
  for (const expiry of [undefined, 3, "soon", "2026-02-30", "2000-01-01"]) {
    expect(isValidSensitiveExemption({ ...valid, expiry })).toBe(false);
  }
});

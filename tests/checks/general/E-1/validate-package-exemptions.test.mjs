import { expect, test } from "@jest/globals";
import { validatePackageExemptions } from "../../../../src/checks/general/E-1/validate-package-exemptions.mjs";

test("accepts omitted or empty exemption lists", () => {
  expect(validatePackageExemptions()).toBeNull();
  expect(validatePackageExemptions([])).toBeNull();
});

test("requires complete Eli-approved exemption records", () => {
  const valid = { ruleId: "E-1", reason: "approved exception", approver: "Eli", approvalTimestamp: "2026-01-01T00:00:00Z", expiry: null };
  expect(validatePackageExemptions([valid])).toBeNull();
  for (const item of [null, {}, { ...valid, ruleId: "" }, { ...valid, reason: "" }, { ...valid, approver: "Other" }, { ...valid, approvalTimestamp: "" }, { ...valid, expiry: 1 }]) {
    expect(validatePackageExemptions([item])).toContain("exempt");
  }
});

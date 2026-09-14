import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/A-1.9.8.mjs";

test("validates recorded exemption metadata", () => {
  const exemption = {
    ruleId: "E-1.10",
    reason: "fixture",
    approver: "Eli",
    approvalTimestamp: "2026-09-01T00:00:00Z",
    expiry: null,
  };
  expect(run({ packageJson: { eliware: { exempt: [exemption] } } }).status).toBe("pass");
  expect(
    run({ packageJson: { eliware: { exempt: [{ ...exemption, expiry: "never" }] } } }).status,
  ).toBe("fail");
  expect(run({ packageJson: {} }).status).toBe("pass");
});

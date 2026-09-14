import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.6/A-1.6.2.mjs";

test("requires exact paths for tracked secret exceptions", () => {
  const valid = {
    ruleId: "E-1.6.0",
    path: ".env",
    reason: "fixture",
    approver: "Eli",
    approvalTimestamp: "2026-09-01T00:00:00Z",
    expiry: null,
  };
  expect(run({ packageJson: { eliware: { exempt: [valid] } } }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { exempt: [{ ...valid, path: "*.env" }] } } }).status).toBe(
    "fail",
  );
  expect(run({ packageJson: { eliware: { exempt: [{ ...valid, path: "" }] } } }).status).toBe(
    "fail",
  );
  expect(
    run({ packageJson: { eliware: { exempt: [{ ...valid, ruleId: "E-1.7", path: "*.env" }] } } }).status,
  ).toBe("fail");
  expect(run({ packageJson: { eliware: {} } }).status).toBe("pass");
});

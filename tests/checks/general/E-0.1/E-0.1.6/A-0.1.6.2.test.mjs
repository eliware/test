import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.6/A-0.1.6.2.mjs";

test("requires exact paths for secret-file exceptions", () => {
  const valid = {
    ruleId: "E-0.1.6.0",
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
    run({ packageJson: { eliware: { exempt: [{ ...valid, ruleId: "E-0.1.7", path: "*.env" }] } } })
      .status,
  ).toBe("fail");
  expect(run({ packageJson: { eliware: {} } }).status).toBe("pass");
});

test("reports every invalid secret-path exemption", () => {
  const result = run({
    packageJson: {
      eliware: {
        exempt: [
          { ruleId: "E-0.1.6.0", path: "*.env" },
          { ruleId: "A-0.1.6.2", path: "" },
        ],
      },
    },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("exempt[0]");
  expect(result.message).toContain("exempt[1]");
});

test("leaves malformed exemption shapes to the dedicated exemption check", () => {
  expect(run({ packageJson: { eliware: { exempt: [null, "invalid"] } } }).status).toBe("pass");
});

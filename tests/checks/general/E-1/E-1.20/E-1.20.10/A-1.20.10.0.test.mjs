import { expect, test } from "@jest/globals";
import { run } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/A-1.20.10.0.mjs";

test("accepts a valid temporary 100x4 exemption", () => {
  expect(
    run({
      packageJson: {
        eliware: {
          exempt: [
            {
              ruleId: "E-1.20.10",
              reason: "migration",
              approver: "Eli",
              approvalTimestamp: "2026-09-13T00:00:00Z",
              expiry: "2026-09-30",
              review: "2026-09-20",
            },
          ],
        },
      },
    }),
  ).toEqual({
    ruleId: "A-1.20.10.0",
    status: "pass",
    message: "",
  });
});

test("rejects malformed 100x4 exemptions", () => {
  expect(
    run({
      packageJson: {
        eliware: {
          exempt: [
            {
              ruleId: "E-1.20.10",
              reason: "",
              approver: "Eli",
              approvalTimestamp: "2026-09-13T00:00:00Z",
              expiry: null,
            },
          ],
        },
      },
    }),
  ).toEqual(expect.objectContaining({ status: "fail" }));
});

test("accepts a package without a 100x4 exemption", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId: "A-1.20.10.0", status: "pass", message: "" });
});

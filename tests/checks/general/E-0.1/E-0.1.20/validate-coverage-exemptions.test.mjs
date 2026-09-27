import { expect, test } from "@jest/globals";
import { runCoverageExemptionCheck } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-coverage-exemptions.mjs";
const ruleId = "A-0.1.130.14.0";
const coverageRuleId = "E-0.1.130.14";
const run = (context) => runCoverageExemptionCheck(context, { ruleId, coverageRuleId });

test("accepts a valid temporary 100x4 exemption", () => {
  expect(
    run({
      packageJson: {
        eliware: {
          exempt: [
            {
              ruleId: coverageRuleId,
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
    ruleId,
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
              ruleId: coverageRuleId,
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

test("allows absent optional exemption metadata while parent coverage enforcement remains required", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId, status: "pass", message: "" });
});

test("returns check failures for malformed exemption collections and entries", () => {
  expect(run({ packageJson: { eliware: { exempt: {} } } })).toMatchObject({
    status: "fail",
    message: "Package exemptions must be an array.",
  });
  expect(run({ packageJson: { eliware: { exempt: [null] } } })).toMatchObject({
    status: "fail",
    message: "Package exemptions must contain objects.",
  });
});

test("rejects malformed exemptions even when they target another rule", () => {
  expect(run({ packageJson: { eliware: { exempt: [{ ruleId: "E-0.1.3" }] } } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("Every exemption must identify"),
  });
});

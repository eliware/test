import { expect, test } from "@jest/globals";
import { prepareValidationExemptions } from "../../src/orchestrators/prepare-validation-exemptions.mjs";

test("combines package exemptions with validated ignored rule IDs", () => {
  const packageJson = {
    eliware: {
      exempt: [
        {
          ruleId: "E-0.1.0",
          reason: "fixture",
          approver: "Eli",
          approvalTimestamp: "2026-09-14T00:00:00Z",
          expiry: null,
        },
      ],
    },
  };
  const checks = [{ ruleId: "E-0.1.0" }, { ruleId: "E-0.1.1" }];
  expect(prepareValidationExemptions(packageJson, checks, ["E-0.1.1"])).toEqual(
    new Set(["E-0.1.0", "E-0.1.1"]),
  );
});

test("rejects an unknown CLI ignored ID", () => {
  expect(() => prepareValidationExemptions({}, [{ ruleId: "E-0.1.0" }], ["E-9"])).toThrow(
    /Unknown convention exemption rule ID/,
  );
});

test("rejects exemptions for unknown checks", () => {
  expect(() =>
    prepareValidationExemptions(
      {
        eliware: {
          exempt: [
            {
              ruleId: "E-999",
              reason: "fixture",
              approver: "Eli",
              approvalTimestamp: "2026-09-14T00:00:00Z",
              expiry: null,
            },
          ],
        },
      },
      [{ ruleId: "E-0.1.0" }],
    ),
  ).toThrow(/Unknown convention exemption rule ID/);
});

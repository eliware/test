import { expect, test } from "@jest/globals";
import { prepareValidationExemptions } from "../../src/orchestrators/prepare-validation-exemptions.mjs";

test("combines package exemptions with ignored rule IDs", () => {
  const packageJson = {
    eliware: {
      exempt: [{ ruleId: "E-1.0", reason: "fixture", approver: "Eli", expiry: null }],
    },
  };
  const checks = [{ ruleId: "E-1.0" }, { ruleId: "E-1.1" }];
  expect(prepareValidationExemptions(packageJson, checks, ["E-1.1"])).toEqual(
    new Set(["E-1.0", "E-1.1"]),
  );
});

test("rejects exemptions for unknown checks", () => {
  expect(() => prepareValidationExemptions(
    { eliware: { exempt: [{ ruleId: "E-999" }] } },
    [{ ruleId: "E-1.0" }],
  )).toThrow(/Unknown convention exemption rule ID/);
});

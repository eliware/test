import { expect, test } from "@jest/globals";
import { validateExemptionIds } from "../../src/orchestrators/validate-exemption-ids.mjs";

test("accepts exemptions for discovered checks", () => {
  expect(() =>
    validateExemptionIds({ eliware: { exempt: [{ ruleId: "E-1" }] } }, [{ ruleId: "E-1" }]),
  ).not.toThrow();
});

test("rejects exemptions for unknown checks", () => {
  expect(() =>
    validateExemptionIds({ eliware: { exempt: [{ ruleId: "E-9" }] } }, [{ ruleId: "E-1" }]),
  ).toThrow("Unknown convention exemption rule ID: E-9");
});

test("validates CLI ignored IDs against the complete registry", () => {
  expect(() => validateExemptionIds({ eliware: { exempt: [] } }, [{ ruleId: "E-1" }], ["E-9"])).toThrow("Unknown convention exemption rule ID: E-9");
});

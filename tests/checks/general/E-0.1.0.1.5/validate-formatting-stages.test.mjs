import { expect, test } from "@jest/globals";
import { validateFormattingStages } from "../../../../src/checks/general/E-0.1.0.1.5/validate-formatting-stages.mjs";

test("requires passing cached lint and format stages", () => {
  expect(
    validateFormattingStages({
      lint: { code: 0, status: "pass" },
      format: { code: 0, status: "pass" },
    }),
  ).toEqual([]);
});

test("reports missing, failing, and incomplete stage evidence", () => {
  expect(validateFormattingStages(undefined)).toHaveLength(1);
  expect(validateFormattingStages({ lint: { code: 2, status: "fail" }, format: {} })).toEqual([
    "The cached lint stage must pass.",
    "The cached format-check stage must pass.",
  ]);
});

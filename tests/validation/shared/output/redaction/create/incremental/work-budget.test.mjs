import { expect, test } from "@jest/globals";
import { createSecretSearchWorkBudget } from "../../../../../../../src/validation/shared/output/redaction/create/incremental/work-budget.mjs";

test("allows cumulative work through the limit and rejects work beyond it", () => {
  const hasBudget = createSecretSearchWorkBudget(5);
  expect(hasBudget(2)).toBe(true);
  expect(hasBudget(3)).toBe(true);
  expect(hasBudget(1)).toBe(false);
});

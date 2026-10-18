import { expect, test } from "@jest/globals";
import { compatibleWithNode26 } from "../../../../../src/validation/stages/pack/validate/compatible-node-range.mjs";

test("accepts semantically equivalent Node 26 engine ranges", () => {
  for (const range of [
    ">=26.0.0 <27.0.0",
    ">=26",
    ">=26 <28",
    ">= 26.0.0 < 27.0.0",
    "^26.1.0",
    "26.x",
    "26.4.2 - 26.8.0",
  ]) {
    expect(compatibleWithNode26(range)).toBe(true);
  }
  for (const range of [">=25", ">=27", "not a range", "<26", 26])
    expect(compatibleWithNode26(range)).toBe(false);
});

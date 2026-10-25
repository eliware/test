import { expect, test } from "@jest/globals";
import { validateSiblingSequences } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/ids/sibling-sequences.mjs";

test("accepts sibling suffixes that start at zero and stay sequential", () => {
  expect(
    validateSiblingSequences([
      "E-0.1.0",
      "E-0.1.1",
      "E-0.1.0.0",
      "E-0.1.0.1",
      "E-0.3.1",
      "E-0.3.0",
    ]),
  ).toEqual([]);
});

test("reports gaps, padded suffixes, and oversized suffixes", () => {
  expect(
    validateSiblingSequences(["E-0.1.0", "E-0.1.2", "E-0.2.00", "E-0.2.9007199254740993"]),
  ).toEqual([
    "Sibling IDs in E-0.1 must start at 0 and be sequential.",
    "Sibling IDs in E-0.2 must start at 0 and be sequential.",
  ]);
});

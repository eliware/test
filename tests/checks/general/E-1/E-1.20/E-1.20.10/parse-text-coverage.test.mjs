import { expect, test } from "@jest/globals";
import { parseText } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/parse-text-coverage.mjs";

test("parses text coverage evidence", () => {
  expect(parseText("All files | 100 | 99 | 100 | 100 |\n").totals.branches).toBe(99);
});

test("returns null for malformed text reports", () => {
  expect(parseText("no coverage row\n")).toBeNull();
  expect(parseText("All files | nope | 99 | 100 | 100 |\n")).toBeNull();
  expect(parseText("All files | 100 | 99 |\n")).toBeNull();
});

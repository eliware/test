import { expect, test } from "@jest/globals";
import { parseText } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/parse-text-coverage.mjs";

test("parses text coverage evidence", () => {
  expect(
    parseText("src/example.mjs | 100 | 99 | 100 | 100 |\nAll files | 100 | 99 | 100 | 100 |\n", [
      "src/example.mjs",
    ]).totals.branches,
  ).toBe(99);
});

test("returns null for malformed text reports", () => {
  expect(parseText("no coverage row\n", ["src/example.mjs"])).toBeNull();
  expect(
    parseText("src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |"),
  ).toBeNull();
  expect(parseText("All files | nope | 99 | 100 | 100 |\n", ["src/example.mjs"])).toBeNull();
  expect(parseText("All files | 100 | 99 |\n", ["src/example.mjs"])).toBeNull();
});

test("rejects omitted or duplicated source rows instead of trusting aggregate totals", () => {
  const allFiles = "All files | 100 | 100 | 100 | 100 |";
  expect(() =>
    parseText(`src/a.mjs | 100 | 100 | 100 | 100 |\n${allFiles}`, ["src/a.mjs", "src/b.mjs"]),
  ).toThrow("missing: src/b.mjs");
  expect(() =>
    parseText(
      `src/a.mjs | 100 | 100 | 100 | 100 |\nsrc/a.mjs | 100 | 100 | 100 | 100 |\n${allFiles}`,
      ["src/a.mjs"],
    ),
  ).toThrow("duplicate: src/a.mjs");
});

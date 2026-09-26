import { expect, test } from "@jest/globals";
import { parseText } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/parse-text-coverage.mjs";

test("parses text coverage evidence", () => {
  expect(parseText("src/example.mjs | 100 | 99 | 100 | 100 |\nAll files | 100 | 99 | 100 | 100 |\n", ["src/example.mjs"]).totals.branches).toBe(99);
});

test("accepts normalized Windows source paths and rejects arbitrary report labels", () => {
  expect(parseText("C:\\repo\\src\\example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |", ["src/example.mjs"]))
    .toMatchObject({ gaps: [] });
  expect(() => parseText("README.md | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |"))
    .toThrow("non-source file");
});

test("rejects aggregate coverage when a discovered source file row is omitted", () => {
  const report = "src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |";
  expect(() => parseText(report, ["src/example.mjs", "src/omitted.mjs"]))
    .toThrow("missing: src/omitted.mjs");
});

test("rejects duplicate and unexpected source rows", () => {
  const report = [
    "src/example.mjs | 100 | 100 | 100 | 100 |",
    "src/example.mjs | 100 | 100 | 100 | 100 |",
    "All files | 100 | 100 | 100 | 100 |",
  ].join("\n");
  expect(() => parseText(report, ["src/example.mjs"]))
    .toThrow("duplicate: src/example.mjs");
});

test("returns null for malformed text reports", () => {
  expect(parseText("no coverage row\n", ["src/example.mjs"])).toBeNull();
  expect(parseText("src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |"))
    .toBeNull();
  expect(parseText("All files | nope | 99 | 100 | 100 |\n", ["src/example.mjs"])).toBeNull();
  expect(parseText("All files | 100 | 99 |\n", ["src/example.mjs"])).toBeNull();
});

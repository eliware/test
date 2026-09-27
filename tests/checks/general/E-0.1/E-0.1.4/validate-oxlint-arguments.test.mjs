import { expect, test } from "@jest/globals";
import { validateOxlintArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.4/validate-oxlint-arguments.mjs";

test("accepts no extra arguments or a positive thread count", () => {
  expect(validateOxlintArguments()).toBeNull();
  expect(validateOxlintArguments(["--threads=4"])).toBeNull();
});

test("rejects options that can alter lint scope or policy", () => {
  for (const args of [
    ["--quiet"],
    ["--fix"],
    ["--config", "other.json"],
    ["--threads=0"],
    ["--threads=-1"],
  ]) {
    expect(validateOxlintArguments(args)).toContain("may only set a positive");
  }
});

test("rejects non-string and sparse arguments", () => {
  expect(validateOxlintArguments(["--threads=2", null])).toBe(
    "Oxlint arguments must be an array of strings.",
  );
  const sparse = ["--threads=2"];
  sparse.length = 2;
  expect(validateOxlintArguments(sparse)).toBe("Oxlint arguments must be an array of strings.");
});

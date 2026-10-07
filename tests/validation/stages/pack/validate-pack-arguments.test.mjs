import { expect, test } from "@jest/globals";
import { validatePackArguments } from "../../../../src/validation/stages/pack/validate-pack-arguments.mjs";

test("rejects arguments that can disable dry-run or alter selected pack output", () => {
  for (const args of [
    ["--dry-run=false"],
    ["--no-dry-run"],
    ["--json=false"],
    ["--no-json"],
    ["--pack-destination", "out"],
    ["--workspace=other"],
    ["-w", "other"],
    ["--prefix=other"],
    ["@scope/package@1.0.0"],
    ["--", "--no-dry-run"],
    ["--loglevel", "--no-dry-run"],
    ["-wother"],
  ]) {
    expect(validatePackArguments(args)).toMatch(/cannot/u);
  }
});

test("allows safe options while requiring their values", () => {
  expect(validatePackArguments()).toBeNull();
  expect(validatePackArguments(["--ignore-scripts", "--loglevel", "verbose"])).toBeNull();
  expect(validatePackArguments(["--loglevel=verbose"])).toBeNull();
  expect(validatePackArguments(["--loglevel"])).toContain("requires a value");
  expect(validatePackArguments(["--loglevel", "--unknown"])).toContain("requires a value");
});

test("returns a stable diagnostic for malformed argument inputs", () => {
  for (const args of [null, "--dry-run", {}, ["--dry-run", 1]])
    expect(validatePackArguments(args)).toBe(
      "Pack arguments must be provided as an array of strings.",
    );
});

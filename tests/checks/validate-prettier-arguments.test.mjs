import { expect, test } from "@jest/globals";
import { validatePrettierArguments } from "../../src/checks/validate-prettier-arguments.mjs";

test.each([
  "--write",
  "--write=true",
  "--check",
  "--list-different",
  "--ignore-path",
  "--ignore-path=custom.ignore",
  "--no-ignore",
  "--config",
  "--no-config",
  "--single-quote",
  "--print-width=120",
  "--range-start=10",
  "--require-pragma",
  "--plugin=custom-plugin",
  "--help",
])("rejects wrapper-owned or coverage-changing option %s", (argument) => {
  expect(validatePrettierArguments([argument])).toContain(argument);
});

test("allows harmless forwarded options and additional paths", () => {
  expect(validatePrettierArguments(["--log-level=debug", "src/example.mjs"])).toBeNull();
});

test("rejects malformed argument collections", () => {
  expect(validatePrettierArguments(null)).toContain("array of strings");
  expect(validatePrettierArguments(["--log-level", 2])).toContain("array of strings");
});

import { expect, test } from "@jest/globals";
import { validateInformationalArguments } from "../../../../src/cli/read/validate/informational-arguments.mjs";

test("allows one informational command by itself", () => {
  expect(validateInformationalArguments(["--help"])).toBeUndefined();
  expect(validateInformationalArguments(["--version"])).toBeUndefined();
});

test("rejects repeated or combined informational commands", () => {
  expect(() => validateInformationalArguments(["--help", "--version"])).toThrow(
    "cannot be used together",
  );
  expect(() => validateInformationalArguments(["--help", "--help"])).toThrow("cannot be repeated");
  expect(() => validateInformationalArguments(["--help", "--lint"])).toThrow(
    "cannot be combined with validation arguments",
  );
});

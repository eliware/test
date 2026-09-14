import { expect, test } from "@jest/globals";
import { normalizeCliError } from "../../src/cli/normalize-cli-error.mjs";

test("writes an error and returns the internal-error exit code", () => {
  const output = [];
  expect(normalizeCliError(new Error("failure"), (value) => output.push(value))).toBe(18);
  expect(output).toEqual(["failure"]);
});

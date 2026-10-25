import { expect, test } from "@jest/globals";
import { findJestOutputRedactionKinds } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/redaction-kinds.mjs";

test("returns no categories for safe output", () => {
  expect(findJestOutputRedactionKinds({ stdout: ["safe"], stderr: [] }, [])).toEqual([]);
});

test("identifies each supported redaction category", () => {
  const output = {
    stdout: ["password=hidden Authorization: Bearer abc123 ghp_abcdef123456"],
    stderr: ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"],
  };
  expect(findJestOutputRedactionKinds(output, ["hidden"])).toEqual([
    "environment secret",
    "credential field",
    "HTTP credential",
    "known token format",
    "generic Base64 credential",
  ]);
});

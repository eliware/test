import { expect, test } from "@jest/globals";
import { validateJestSourceFilePolicy } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/source/file-policy.mjs";

test("collects runner and coverage findings for one source file", () => {
  expect(
    validateJestSourceFilePolicy("src/run.mjs", 'import("vitest"); /* c8 ignore next */'),
  ).toEqual([
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
    "src/run.mjs must not exclude production coverage.",
  ]);
});

test("allows the primary library export barrel to use a coverage exclusion", () => {
  const content = '/* istanbul ignore file */\nexport { value } from "../value.mjs";';
  expect(
    validateJestSourceFilePolicy("src/index.mjs", content, { allowLibraryBarrel: true }),
  ).toEqual([]);
});

test("applies the harness test-tool policy to one source file", () => {
  expect(
    validateJestSourceFilePolicy("src/run.mjs", 'import { test } from "@jest/globals";', {
      harness: true,
    }),
  ).toEqual([]);
});

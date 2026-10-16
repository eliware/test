import { expect, test } from "@jest/globals";
import { findTestPolicyViolations } from "../../../src/validation/harness/scan-test-policy.mjs";

test("reports write, network, and clock effects in one source scan", () => {
  const source = [
    'jest.mock("node:fs/promises");',
    'import { writeFile } from "node:fs/promises";',
    'fetch("https://outside.example");',
    "Date.now();",
  ].join("\n");
  expect(findTestPolicyViolations(source, "tests/effects.test.mjs")).toEqual([
    "tests/effects.test.mjs:2 uses a test API that creates files or temporary directories: import of writeFile.",
    "tests/effects.test.mjs: must use fake timers or inject a fixed clock for date calls.",
    "tests/effects.test.mjs: must mock fetch, inject it, or use a localhost URL.",
  ]);
});

test("reports malformed source with its path", () => {
  expect(findTestPolicyViolations("const = ;", "tests/broken.test.mjs")).toEqual([
    "tests/broken.test.mjs: could not parse the test module.",
  ]);
});

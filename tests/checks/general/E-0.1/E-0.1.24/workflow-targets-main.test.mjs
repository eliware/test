import { beforeEach, expect, jest, test } from "@jest/globals";
const { minimatch: actualMinimatch } = await import("minimatch");
const minimatch = jest.fn((...args) => actualMinimatch(...args));
jest.unstable_mockModule("minimatch", () => ({ minimatch }));
const { pullRequestTargetsMain, pushTargetsMain } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.24/workflow-targets-main.mjs");

beforeEach(() => {
  minimatch.mockImplementation((...args) => actualMinimatch(...args));
});

test("evaluates push branch shapes and main inclusion", () => {
  expect(pushTargetsMain(["main"])).toBe(true);
  expect(pushTargetsMain(["main*"])).toBe(true);
  expect(pushTargetsMain(["*", "!main*"])).toBe(false);
  expect(pushTargetsMain(["*", "!main*", "main"])).toBe(true);
  expect(pushTargetsMain(["dev"])).toBe(false);
  expect(pushTargetsMain(["!main"])).toBe(false);
  for (const push of [undefined, null, false]) expect(pushTargetsMain(push)).toBe(false);
  expect(pushTargetsMain(true)).toBe(false);
  expect(pushTargetsMain({})).toBe(false);
  expect(pushTargetsMain({ branches: [] })).toBe(false);
  expect(pushTargetsMain({ branches: ["*", null, "!release/*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["main", "!main"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["*", "!main", "main"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["main"], "branches-ignore": ["m*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["main"], "branches-ignore": [null] })).toBe(false);
});

test("evaluates pull-request branch shapes and main exclusions", () => {
  for (const event of [undefined, null, false]) expect(pullRequestTargetsMain(event)).toBe(false);
  expect(pullRequestTargetsMain("pull_request")).toBe(false);
  expect(pullRequestTargetsMain([])).toBe(false);
  expect(pullRequestTargetsMain({})).toBe(false);
  expect(pullRequestTargetsMain({ branches: ["main"] })).toBe(true);
  expect(pullRequestTargetsMain({ branches: ["!main"] })).toBe(false);
  expect(pullRequestTargetsMain({ branches: ["*", "!main", "main"] })).toBe(true);
  expect(pullRequestTargetsMain({ "branches-ignore": ["main"] })).toBe(false);
  expect(pullRequestTargetsMain({ "branches-ignore": ["release/*", null] })).toBe(false);
  expect(pullRequestTargetsMain({ branches: ["main", 42] })).toBe(false);
});

test("matches GitHub branch patterns with ordered inclusion and exclusion", () => {
  expect(pushTargetsMain({ branches: ["**/main", "!**/main"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["**", "!**/main", "main"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["main", "!main", "*"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["*", "!main", "!m*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["main", "release/*"] })).toBe(true);
  expect(pushTargetsMain({ branches: ["!release/*"] })).toBe(false);
  expect(pushTargetsMain({ branches: ["*", "!release/*"] })).toBe(true);
});

test("treats matcher failures as a branch that does not include main", () => {
  minimatch.mockImplementationOnce(() => {
    throw new Error("invalid pattern");
  });
  expect(pushTargetsMain({ branches: ["malformed-pattern"] })).toBe(false);
});

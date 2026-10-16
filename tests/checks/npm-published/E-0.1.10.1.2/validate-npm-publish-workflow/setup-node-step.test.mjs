import { expect, test } from "@jest/globals";
import { isValidNpmSetupNodeStep } from "../../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow/setup-node-step.mjs";

const step = {
  uses: "actions/setup-node@v7",
  with: {
    "node-version": 26,
    "registry-url": "https://registry.npmjs.org",
    "package-manager-cache": false,
  },
};

test.each([26, "26"])("accepts Node.js version %s", (version) => {
  expect(
    isValidNpmSetupNodeStep({ ...step, with: { ...step.with, "node-version": version } }),
  ).toBe(true);
});

test.each([
  { ...step, uses: "actions/setup-node@v6" },
  { ...step, with: { ...step.with, "registry-url": "https://example.test" } },
  { ...step, with: { ...step.with, "package-manager-cache": true } },
  { ...step, with: { ...step.with, cache: "npm" } },
  { ...step, if: "always()" },
  { ...step, "continue-on-error": true },
])("rejects invalid setup-node configuration", (candidate) => {
  expect(isValidNpmSetupNodeStep(candidate)).toBe(false);
});

test("rejects a setup-node step without inputs", () => {
  expect(isValidNpmSetupNodeStep({ uses: "actions/setup-node@v7" })).toBe(false);
});

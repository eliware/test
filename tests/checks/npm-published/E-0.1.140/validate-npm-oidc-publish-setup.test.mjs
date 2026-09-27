import { expect, test } from "@jest/globals";
import { validateNpmOidcPublishSetup } from "../../../../src/checks/npm-published/E-0.1.140/validate-npm-oidc-publish-setup.mjs";

const validJob = {
  steps: [
    {
      uses: "actions/setup-node@v7",
      with: {
        "node-version": 26,
        "registry-url": "https://registry.npmjs.org",
        "package-manager-cache": false,
      },
    },
  ],
};

test("accepts the documented Node.js and npm OIDC setup", () => {
  expect(validateNpmOidcPublishSetup(validJob)).toBeNull();
});

test("requires setup-node v7 exactly once", () => {
  expect(validateNpmOidcPublishSetup({ steps: [{ uses: "actions/setup-node@v6" }] })).toContain(
    "setup-node@v7",
  );
  expect(validateNpmOidcPublishSetup({ steps: [...validJob.steps, ...validJob.steps] })).toContain(
    "exactly once",
  );
});

test("handles malformed setup steps and missing setup options", () => {
  expect(validateNpmOidcPublishSetup({ steps: [null, {}] })).toContain("setup-node@v7");
  expect(validateNpmOidcPublishSetup({ steps: [{ uses: "actions/setup-node@v7" }] })).toContain(
    "Node.js 26",
  );
});

test.each([
  [{ ...validJob.steps[0].with, "node-version": 22 }, "Node.js 26"],
  [
    { ...validJob.steps[0].with, "registry-url": "https://registry.example" },
    "public npm registry",
  ],
  [{ ...validJob.steps[0].with, "package-manager-cache": true }, "disable package-manager caching"],
])("rejects setup-node options outside the documented configuration", (options, message) => {
  expect(
    validateNpmOidcPublishSetup({ steps: [{ ...validJob.steps[0], with: options }] }),
  ).toContain(message);
});

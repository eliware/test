import { expect, test } from "@jest/globals";
import { validateApplicationJestPolicy } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/jest-policy.mjs";

test("combines configuration and test-tool policy failures", async () => {
  const context = {
    packageJson: { name: "app", jest: {}, scripts: { test: "vitest run" } },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toEqual(
    expect.arrayContaining([
      'Jest testEnvironment must be "node".',
      "package.json script test must not invoke a separate test or coverage tool.",
    ]),
  );
});

test("rejects a separate test runner command", async () => {
  const context = {
    packageJson: {
      name: "app",
      scripts: { test: "vitest run" },
    },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    "package.json script test must not invoke a separate test or coverage tool.",
  );
});

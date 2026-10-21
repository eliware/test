import { expect, test } from "@jest/globals";
import { validateApplicationJestPolicy } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/jest-policy.mjs";

test("combines configuration failures", async () => {
  const context = {
    packageJson: { name: "app", jest: {} },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    'Jest testEnvironment must be "node".',
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

import { expect, test } from "@jest/globals";
import { validateApplicationJestPolicy } from "../../../../src/checks/application/E-0.1.4.1.3/validate-application-jest-policy.mjs";

test("combines configuration failures", async () => {
  const context = {
    packageJson: { name: "app", jest: {} },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    'Jest testEnvironment must be "node".',
  );
});

test("allows Jest dependency for the Eliware Test runner itself", async () => {
  const context = {
    packageJson: { name: "@eliware/test", dependencies: { jest: "30" } },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    "package.json must define Jest configuration.",
  );
});

test("rejects direct Jest packages in consumer metadata", async () => {
  const context = {
    packageJson: { name: "app", devDependencies: { jest: "30", "@jest/globals": "30" } },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    "Do not declare Jest packages directly: jest, @jest/globals.",
  );
});

test("reports errors from the default context", async () => {
  await expect(validateApplicationJestPolicy()).resolves.toContain(
    "Jest source policy could not read the repository inventory.",
  );
});

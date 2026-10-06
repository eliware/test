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

test("rejects Jest packages, other runners, and tool scripts in consumer metadata", async () => {
  const context = {
    packageJson: {
      name: "app",
      devDependencies: { jest: "30", "@jest/globals": "30", "babel-jest": "30", vitest: "2" },
      scripts: { test: "vitest run" },
    },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    "Do not declare separate test or coverage tools: jest, @jest/globals, babel-jest, vitest.",
  );
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    "package.json script test must not invoke a separate test or coverage tool.",
  );
});

test("reports errors from the default context", async () => {
  await expect(validateApplicationJestPolicy()).resolves.toContain(
    "Jest source policy could not read the repository inventory.",
  );
});

test.each(["nyc", "c8", "vitest", "mocha", "ava"])(
  "rejects %s runner configuration",
  async (tool) => {
    const context = {
      packageJson: { name: "app", jest: { testEnvironment: "node" }, [tool]: {} },
      repositoryInventory: { files: async () => [], readText: async () => "" },
    };
    await expect(validateApplicationJestPolicy(context)).resolves.toContain(
      "package.json must not configure a separate test runner or coverage engine.",
    );
  },
);

test.each([
  "@playwright/test",
  "@vitest/coverage-v8",
  "@vitest/runner",
  "@tapjs/run",
  "custom-test: npm:mocha@10",
  "custom-cypress: npm:cypress@13",
])("rejects alternative tools declared as %s", async (dependency) => {
  const [name, version] = dependency.includes(":") ? dependency.split(": ") : [dependency, "1"];
  const context = {
    packageJson: { name: "app", devDependencies: { [name]: version } },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  await expect(validateApplicationJestPolicy(context)).resolves.toContain(
    `Do not declare separate test or coverage tools: ${name}.`,
  );
});

test.each([
  "node build.mjs",
  "node_modules/.bin/jest",
  "node --test",
  "npx --yes jest",
  "npm exec --package=jest -- jest",
  "pnpm exec vitest",
  "pnpm dlx jest",
])("checks alternative tool script syntax: %s", async (command) => {
  const context = {
    packageJson: { name: "app", scripts: { test: command } },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  };
  const errors = await validateApplicationJestPolicy(context);
  if (command === "node build.mjs")
    expect(errors).not.toContain(expect.stringContaining("script test"));
  else
    expect(errors).toContain(
      "package.json script test must not invoke a separate test or coverage tool.",
    );
});

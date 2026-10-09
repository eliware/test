import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/library/E-0.1.3.1.3.mjs";

const packageJson = {
  jest: {
    collectCoverageFrom: ["src/**/*.mjs"],
    coverageReporters: ["text", "json-summary"],
    coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.mjs"],
  },
};

test("enforces the shared Jest and coverage policy for libraries", async () => {
  const repositoryInventory = { files: async () => [], readText: async () => "" };
  await expect(run({ packageJson, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(run({ packageJson: {}, repositoryInventory })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("package.json must define Jest configuration."),
  });
});

test("uses the default context", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("uses application checks when application also applies", async () => {
  await expect(
    run({ packageJson: { eliware: { apply: ["general", "application", "library"] } } }),
  ).resolves.toMatchObject({
    status: "pass",
    message: "Application checks enforce the shared Jest and coverage policy.",
  });
});

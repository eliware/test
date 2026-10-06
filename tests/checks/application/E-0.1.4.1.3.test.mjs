import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.3.mjs";

test("E-0.1.4.1.3 accepts the Eliware Test Jest setup", async () => {
  const result = await run({
    packageJson: { name: "@eliware/test", jest: jestConfig() },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  });
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});

test("E-0.1.4.1.3 rejects low coverage settings", async () => {
  const config = jestConfig();
  config.coverageThreshold.global.lines = 99;
  const result = await run({
    packageJson: { name: "app", jest: config },
    repositoryInventory: { files: async () => [], readText: async () => "" },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("lines coverage must be 100 percent");
});

test("E-0.1.4.1.3 uses its default context", async () => {
  await expect(run(undefined)).resolves.toMatchObject({ ruleId, status: "fail" });
});

function jestConfig() {
  return {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.mjs"],
    collectCoverageFrom: ["src/**/*.mjs"],
    coverageReporters: ["text", "json-summary"],
    coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
  };
}

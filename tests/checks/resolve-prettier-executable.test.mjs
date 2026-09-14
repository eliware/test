import { expect, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { resolvePrettierExecutable } from "../../src/checks/resolve-prettier-executable.mjs";

test("resolves string and object Prettier binary metadata", async () => {
  const packagePath = join("fixture-repo", "node_modules", "prettier", "package.json");
  const resolvePackage = () => packagePath;
  const expected = resolve("fixture-repo", "node_modules", "prettier", "bin", "prettier.cjs");
  await expect(resolvePrettierExecutable({ resolvePackage, readPackage: async () => JSON.stringify({ bin: "bin/prettier.cjs" }) })).resolves.toBe(expected);
  await expect(resolvePrettierExecutable({ resolvePackage, readPackage: async () => JSON.stringify({ bin: { prettier: "bin/prettier.cjs" } }) })).resolves.toBe(expected);
});

test("rejects Prettier metadata without an executable", async () => {
  await expect(resolvePrettierExecutable({ resolvePackage: () => "C:\\repo\\package.json", readPackage: async () => JSON.stringify({ bin: {} }) })).rejects.toThrow("Prettier package does not declare an executable.");
});

test("resolves the installed Prettier executable with default dependencies", async () => {
  await expect(resolvePrettierExecutable()).resolves.toMatch(/prettier/);
});

import { expect, test } from "@jest/globals";
import { resolvePrettierExecutable } from "../../src/checks/resolve-prettier-executable.mjs";

test("resolves string and object Prettier binary metadata", async () => {
  const resolvePackage = () => "C:\\repo\\node_modules\\prettier\\package.json";
  await expect(resolvePrettierExecutable({ resolvePackage, readPackage: async () => JSON.stringify({ bin: "bin/prettier.cjs" }) })).resolves.toBe("C:\\repo\\node_modules\\prettier\\bin\\prettier.cjs");
  await expect(resolvePrettierExecutable({ resolvePackage, readPackage: async () => JSON.stringify({ bin: { prettier: "bin/prettier.cjs" } }) })).resolves.toBe("C:\\repo\\node_modules\\prettier\\bin\\prettier.cjs");
});

test("rejects Prettier metadata without an executable", async () => {
  await expect(resolvePrettierExecutable({ resolvePackage: () => "C:\\repo\\package.json", readPackage: async () => JSON.stringify({ bin: {} }) })).rejects.toThrow("Prettier package does not declare an executable.");
});

test("resolves the installed Prettier executable with default dependencies", async () => {
  await expect(resolvePrettierExecutable()).resolves.toMatch(/prettier/);
});

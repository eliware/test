import { expect, test } from "@jest/globals";
import { resolveOxlintExecutable } from "../../../../../src/checks/general/E-1/E-1.4/resolve-oxlint-executable.mjs";

test("resolves string and named Oxlint package binaries and rejects missing metadata", async () => {
  const requireFactory = () => ({ resolve: () => "/pkg/oxlint/package.json" });
  await expect(
    resolveOxlintExecutable(requireFactory, async () => JSON.stringify({ bin: "bin/oxlint.js" })),
  ).resolves.toMatch(/[\\/]pkg[\\/]oxlint[\\/]bin[\\/]oxlint\.js$/u);
  await expect(
    resolveOxlintExecutable(requireFactory, async () => JSON.stringify({ bin: { oxlint: "bin/cli.js" } })),
  ).resolves.toMatch(/[\\/]pkg[\\/]oxlint[\\/]bin[\\/]cli\.js$/u);
  await expect(
    resolveOxlintExecutable(requireFactory, async () => JSON.stringify({ bin: {} })),
  ).rejects.toThrow("does not declare an executable");
  await expect(
    resolveOxlintExecutable(requireFactory, async () => JSON.stringify({ bin: null })),
  ).rejects.toThrow("does not declare an executable");
});

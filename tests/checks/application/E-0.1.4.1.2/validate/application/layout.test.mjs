import { expect, jest, test } from "@jest/globals";
import validateApplicationLayout from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/application/layout.mjs";
test("runs layout validators against the repository inventory", async () => {
  await expect(
    validateApplicationLayout({
      repositoryInventory: {
        files: async () => [],
        readText: async () => "",
      },
    }),
  ).resolves.toEqual([]);
});
test("reads each test file once for executable-test and line-limit checks", async () => {
  const readText = jest.fn(async () => 'test("works", () => {});');
  await validateApplicationLayout({
    root: "repo",
    repositoryInventory: {
      files: async () => ["tests/a.test.mjs"],
      readText,
    },
  });
  expect(readText).toHaveBeenCalledTimes(1);
});
test("rejects implementation modules outside src and approved roots", async () => {
  const inventory = {
    files: async (view) => (view === "all" ? ["lib/worker.mjs"] : []),
    readText: async () => "",
  };
  await expect(
    validateApplicationLayout({
      repositoryInventory: inventory,
    }),
  ).resolves.toContain("lib/worker.mjs is an implementation module outside its allowed root.");
});
test("enforces the default method export rule for source modules", async () => {
  await expect(
    validateApplicationLayout({
      root: "repo",
      packageJson: {},
      repositoryInventory: {
        files: async (view) => (view === "all" ? ["src/run.mjs"] : []),
        readText: async () => "export function run() {}",
      },
    }),
  ).resolves.toContain("src/run.mjs must use a default export for its method.");
});
test("allows a declared local validator under scripts/", async () => {
  const inventory = {
    files: async (view) => (view === "all" ? ["scripts/validate.mjs"] : []),
    readText: async () => "",
  };
  await expect(
    validateApplicationLayout({
      repositoryInventory: inventory,
      packageJson: {
        scripts: {
          validate: "node scripts/validate.mjs",
        },
      },
    }),
  ).resolves.toEqual([]);
});
test("uses the default context", async () => {
  await expect(validateApplicationLayout()).rejects.toThrow();
});

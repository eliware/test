import { expect, test } from "@jest/globals";
import { validateApplicationLayout } from "../../../../src/checks/application/E-0.1.4.1.2/validate-application-layout.mjs";

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

test("uses the default context", async () => {
  await expect(validateApplicationLayout()).rejects.toThrow();
});

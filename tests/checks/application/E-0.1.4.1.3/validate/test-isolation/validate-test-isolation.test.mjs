import { expect, test } from "@jest/globals";
import { validateTestIsolation } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-isolation/validate-test-isolation.mjs";

test("checks every test file and skips other files", async () => {
  const inventory = {
    files: async () => ["tests/a.test.mjs", "tests/helper.mjs", "src/a.test.mjs"],
    readText: async () => "fetch(target);",
  };
  await expect(validateTestIsolation({ repositoryInventory: inventory })).resolves.toEqual([
    "tests/a.test.mjs: must mock fetch, inject it, or use a localhost URL.",
  ]);
});

test("reports read and inventory failures", async () => {
  await expect(validateTestIsolation()).resolves.toEqual([
    "Test isolation could not inspect the test files.",
  ]);
  await expect(
    validateTestIsolation({
      repositoryInventory: {
        files: async () => ["tests/a.test.mjs"],
        readText: async () => {
          throw new Error();
        },
      },
    }),
  ).resolves.toEqual(["tests/a.test.mjs could not be read for test isolation checks."]);
  await expect(
    validateTestIsolation({
      repositoryInventory: {
        files: async () => {
          throw new Error();
        },
        readText: async () => "",
      },
    }),
  ).resolves.toEqual(["Test isolation could not inspect the test files."]);
});

test("skips the Eliware Test harness package", async () => {
  await expect(validateTestIsolation({ packageJson: { name: "@eliware/test" } })).resolves.toEqual(
    [],
  );
});

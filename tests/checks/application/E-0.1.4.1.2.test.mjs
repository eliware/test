import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.2.mjs";

test("E-0.1.4.1.2 passes an empty consistent inventory", async () => {
  await expect(
    run({ repositoryInventory: { files: async () => [], readText: async () => "" } }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("E-0.1.4.1.2 reports missing mirrored tests", async () => {
  const result = await run({
    repositoryInventory: { files: async () => ["src/app.mjs"], readText: async () => "" },
  });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("tests/app.test.mjs is required");
});

test("E-0.1.4.1.2 uses its default context", async () => {
  await expect(run(undefined)).rejects.toThrow();
});

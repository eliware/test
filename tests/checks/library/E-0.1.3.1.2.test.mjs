import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/library/E-0.1.3.1.2.mjs";

test("checks library layout when application does not apply", async () => {
  const testSource =
    'import { test } from "@jest/globals"; import "../src/index.mjs"; test("works", () => {});';
  const inventory = {
    files: async () => ["src/index.mjs", "tests/index.test.mjs"],
    readText: async (path) => (path.endsWith("index.test.mjs") ? testSource : "export {};"),
  };
  await expect(
    run({
      root: "C:/repo",
      packageJson: { eliware: { apply: ["library"] } },
      repositoryInventory: inventory,
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the default package and root values", async () => {
  const inventory = { files: async () => [] };
  await expect(run({ repositoryInventory: inventory, packageJson: {} })).resolves.toMatchObject({
    status: "pass",
  });
});

test("uses the default context", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("applies library placement when application already checks shared layout", async () => {
  const inventory = { files: async () => ["src/index.mjs", "bin/run.mjs", "lib/worker.mjs"] };
  await expect(
    run({
      packageJson: { eliware: { apply: ["general", "application", "library"] } },
      repositoryInventory: inventory,
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("lib/worker.mjs"),
  });
});

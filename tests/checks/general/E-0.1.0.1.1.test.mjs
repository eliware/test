import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { run, ruleId } from "../../../src/checks/general/E-0.1.0.1.1.mjs";

test("validates this repository package contract", async () => {
  await expect(
    run({
      root: process.cwd(),
      packageJson: JSON.parse(await readFile("package.json", "utf8")),
      repositoryFiles: [],
    }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports package metadata and required file failures together", async () => {
  const result = await run({ root: "missing", packageJson: {}, repositoryFiles: [] });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("scoped @eliware");
  expect(result.message).toContain("package-lock.json is required");
});

test("reports source scan failures", async () => {
  const result = await run({ root: "missing", packageJson: {}, repositoryFiles: null });
  expect(result.message).toContain("Repository modules could not be inspected");
});

test("uses the inventory file reader when no file list is supplied", async () => {
  const result = await run({
    root: process.cwd(),
    packageJson: JSON.parse(await readFile("package.json", "utf8")),
    repositoryInventory: { repositoryFiles: async () => [] },
  });
  expect(result.status).toBe("pass");
});

test("uses default arguments", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

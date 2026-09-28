import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/web/E-0.1.50/E-0.1.50.1.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("maps clean and excluded asset trees to rule results", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-"));
  await mkdir(join(root, "public"));
  await writeFile(join(root, "public", "index.html"), "ok");
  expect(await run({ root, packageJson: {} })).toEqual({
    ruleId: "E-0.1.50.1",
    status: "pass",
    message: "",
  });
  await mkdir(join(root, "public", "dist"));
  await mkdir(join(root, "public", "build"));
  const excluded = await run({ root, packageJson: {} });
  expect(excluded.message).toContain("output: build.");
  expect(excluded.message).toContain("output: dist.");
  await expect(
    run({ root, packageJson: { eliware: { webAssetExcludes: "dist" } } }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("string array") });
  await rm(root, { recursive: true, force: true });
});

test("uses the shared inventory directory reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-inventory-"));
  await mkdir(join(root, "public", "assets"), { recursive: true });
  await writeFile(join(root, "public", "assets", "app.js"), "ok");
  const repositoryInventory = createRepositoryInventory(root);
  await expect(run({ root, packageJson: {}, repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(root, { recursive: true, force: true });
});

test("maps missing asset directories to the required-root failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-missing-"));
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({
    status: "fail",
    message: "public/ is required as the web public asset root.",
  });
  await rm(root, { recursive: true, force: true });
});

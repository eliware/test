import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.23.mjs";
import { run as runLicensePolicy } from "../../../../src/checks/general/E-0.1/E-0.1.26.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("requires the Eliware MIT license attribution", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-license-"));
  await writeFile(join(root, "LICENSE"), `MIT License\n\nCopyright (c) 2026 Eliware\n\nPermission is hereby granted\nTHE SOFTWARE IS PROVIDED "AS IS"\nWITHOUT WARRANTY OF ANY KIND\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE\n`);
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-0.1.23", status: "pass", message: "" });
  await writeFile(join(root, "LICENSE"), "Apache License\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "LICENSE"), "MIT License\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "LICENSE"), "Copyright (c) 2026 Eliware\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("fails when the root license is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-license-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.23",
    status: "fail",
    message: "LICENSE is required at the repository root.",
  });
  await rm(root, { recursive: true, force: true });
});

test("shares the cached LICENSE text between license checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-license-inventory-"));
  const license = join(root, "LICENSE");
  await writeFile(license, "MIT License\nCopyright (c) 2026 Eliware\nPermission is hereby granted\nTHE SOFTWARE IS PROVIDED \"AS IS\"\nWITHOUT WARRANTY OF ANY KIND\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE\n");
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  await expect(run({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  await expect(runLicensePolicy({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  expect(reads.get(license)).toBe(1);
  await rm(root, { recursive: true, force: true });
});

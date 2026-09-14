import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  referencesIn,
  validateReferences,
} from "../../../../src/checks/workspace/E-1.110/runbook-references.mjs";

test("extracts stable runbook references from indexes", () => {
  expect(referencesIn("[Deploy](./deploy.json#id=deploy)")).toEqual([
    { path: "./deploy.json", id: "deploy" },
  ]);
});

test("validates references across both documentation surfaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbook-references-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "README.md"), "runbooks/deploy.json#id=deploy");
  await writeFile(join(root, "runbooks", "README.md"), "./deploy.json#id=deploy");
  const file = resolve(root, "runbooks", "deploy.json");
  const indexed = new Set();
  await expect(
    validateReferences(root, new Map([[file, { id: "deploy" }]]), indexed),
  ).resolves.toBeNull();
  expect(indexed).toEqual(new Set([file]));
  await rm(root, { recursive: true, force: true });
});

test("reports unresolved references and tolerates absent surfaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbook-references-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "README.md"), "runbooks/missing.json#id=missing");
  await expect(validateReferences(root, new Map(), new Set())).resolves.toMatch(
    /does not resolve to the declared record/,
  );
  await rm(root, { recursive: true, force: true });
  await expect(validateReferences(root, new Map(), new Set())).resolves.toBeNull();
});

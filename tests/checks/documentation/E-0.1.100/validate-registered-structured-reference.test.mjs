import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateRegisteredStructuredReference } from "../../../../src/checks/documentation/E-0.1.100/validate-registered-structured-reference.mjs";

test("requires registration and allows unavailable registered repositories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-registered-structured-reference-"));
  const registeredRoot = join(root, "docs");
  await mkdir(registeredRoot);
  const target = join(registeredRoot, "target.json");
  await writeFile(target, "{}");
  await expect(validateRegisteredStructuredReference({
    reference: "../docs/target.json",
    target,
    registeredRepositoryRoots: [registeredRoot],
  })).resolves.toBeUndefined();
  await expect(validateRegisteredStructuredReference({
    reference: "../docs/missing.json",
    target: join(registeredRoot, "missing.json"),
    registeredRepositoryRoots: [registeredRoot],
  })).resolves.toBeUndefined();
  await rm(registeredRoot, { recursive: true, force: true });
  await expect(validateRegisteredStructuredReference({
    reference: "../docs/target.json",
    target,
    registeredRepositoryRoots: [registeredRoot],
  })).resolves.toBeUndefined();
  await expect(validateRegisteredStructuredReference({
    reference: "../outside.json",
    target: join(root, "outside.json"),
    registeredRepositoryRoots: [registeredRoot],
  })).rejects.toThrow("outside every registered repository path");
  await expect(validateRegisteredStructuredReference({
    reference: "../docs/target.json",
    target,
    registeredRepositoryRoots: null,
    registryError: "authority map unavailable",
  })).rejects.toThrow("authority map unavailable");
  await rm(root, { recursive: true, force: true });
});

test("propagates registered target errors other than missing paths", async () => {
  const error = Object.assign(new Error("permission denied"), { code: "EACCES" });
  await expect(validateRegisteredStructuredReference({
    reference: "../docs/target.json",
    target: "target.json",
    registeredRepositoryRoots: ["."],
    statTarget: async () => { throw error; },
  })).rejects.toBe(error);
});

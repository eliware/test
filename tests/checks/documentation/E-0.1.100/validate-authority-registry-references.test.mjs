import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityRegistryReferences } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-references.mjs";

let root;
let repositoryRoot;
let context;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-authority-references-"));
  repositoryRoot = join(root, "repositories", "example");
  await mkdir(join(repositoryRoot, "specs"), { recursive: true });
  await writeFile(join(repositoryRoot, "package.json"), "{}");
  await writeFile(join(repositoryRoot, "specs", "authority.json"), "{}");
  await writeFile(join(repositoryRoot, "README.md"), "example");
  context = {
    root,
    file: join(root, "authority-map.json"),
    entry: {
      repository: "eliware/example",
      path: "repositories/example",
      package: "package.json",
      authorityFile: "specs/authority.json",
      reference: "README.md",
    },
  };
});

afterEach(async () => rm(root, { recursive: true, force: true }));

test("accepts repository and referenced files that resolve", async () => {
  await expect(validateAuthorityRegistryReferences(context)).resolves.toBeNull();
});

test("requires repository paths and all three repository references", async () => {
  await expect(validateAuthorityRegistryReferences({ ...context, entry: { ...context.entry, path: " " } }))
    .resolves.toContain("must declare path");
  for (const field of ["package", "authorityFile", "reference"]) {
    await expect(validateAuthorityRegistryReferences({
      ...context,
      entry: { ...context.entry, [field]: null },
    })).resolves.toContain(`must declare ${field}`);
  }
});

test("rejects unresolved and escaping references", async () => {
  await expect(validateAuthorityRegistryReferences({
    ...context,
    entry: { ...context.entry, path: "missing" },
  })).resolves.toContain("does not resolve");
  await expect(validateAuthorityRegistryReferences({
    ...context,
    entry: { ...context.entry, package: "../outside.json" },
  })).resolves.toContain("within its repository path");
  await expect(validateAuthorityRegistryReferences({
    ...context,
    entry: { ...context.entry, package: "missing.json" },
  })).resolves.toContain("does not resolve");
});

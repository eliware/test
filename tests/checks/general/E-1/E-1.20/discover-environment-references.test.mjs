import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverEnvironmentReferences } from "../../../../../src/checks/general/E-1/E-1.20/discover-environment-references.mjs";

test("discovers environment references from repository source files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-env-discovery-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export const port = process.env.PORT;");
  await expect(discoverEnvironmentReferences(root)).resolves.toEqual(["PORT"]);
  await rm(root, { recursive: true, force: true });
});

test("fails closed when a source file cannot be parsed", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-env-discovery-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "broken.mjs"), "export const = process.env.PORT;");
  await expect(discoverEnvironmentReferences(root)).rejects.toThrow();
  await rm(root, { recursive: true, force: true });
});

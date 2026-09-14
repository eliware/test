import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateStructuredReferences } from "../../../../src/checks/documentation/E-1.100/validate-structured-references.mjs";

test("accepts local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "target.json"), "{}");
  await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./target.json" }));
  await expect(validateStructuredReferences(root, ["specs/index.json"])).resolves.toBeNull();
  await writeFile(join(root, "root-target.json"), "{}");
  await writeFile(join(root, "specs", "root-index.json"), JSON.stringify({ path: "/root-target.json" }));
  await expect(validateStructuredReferences(root, ["specs/root-index.json"])).resolves.toBeNull();
  await writeFile(join(root, "specs", "parent-index.json"), JSON.stringify({ path: "../root-target.json" }));
  await expect(validateStructuredReferences(root, ["specs/parent-index.json"])).resolves.toBeNull();
  await writeFile(join(root, "specs", "external-index.json"), JSON.stringify({ path: "https://example.test/reference.json" }));
  await expect(validateStructuredReferences(root, ["specs/external-index.json"])).resolves.toBeNull();
  await writeFile(join(root, "specs", "empty-index.json"), JSON.stringify({ path: "#section" }));
  await expect(validateStructuredReferences(root, ["specs/empty-index.json"])).resolves.toBeNull();
  await writeFile(join(root, "specs", "nested-index.json"), JSON.stringify({ items: [{ path: "./target.json" }] }));
  await expect(validateStructuredReferences(root, ["specs/nested-index.json"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("rejects missing local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-missing-"));
  await writeFile(join(root, "index.json"), JSON.stringify({ path: "./missing.json" }));
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow("missing.json");
  await writeFile(join(root, "index.json"), JSON.stringify({ path: "../outside.json" }));
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow("outside the repository");
  await rm(root, { recursive: true, force: true });
});

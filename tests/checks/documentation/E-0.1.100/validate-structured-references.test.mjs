import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateStructuredReferences } from "../../../../src/checks/documentation/E-0.1.100/validate-structured-references.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("accepts local structured references using shared cached reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-"));
  try {
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "specs", "target.json"), "{}");
    await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./target.json" }));
    await expect(
      validateStructuredReferences(root, ["specs/index.json"], createRepositoryInventory(root)),
    ).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skips non-file references while validating documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-url-"));
  try {
    await writeFile(join(root, "index.json"), JSON.stringify({ path: "https://example.test/a" }));
    await expect(validateStructuredReferences(root, ["index.json"])).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects missing local references and repository escapes", async () => {
  const parent = await mkdtemp(join(tmpdir(), "eliware-structured-refs-invalid-"));
  const root = join(parent, "repo");
  try {
    await mkdir(join(root, "specs"), { recursive: true });
    await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./missing.json" }));
    await expect(validateStructuredReferences(root, ["specs/index.json"])).resolves.toContain(
      "missing.json",
    );
    await writeFile(
      join(root, "specs", "index.json"),
      JSON.stringify({ path: "../../outside.json" }),
    );
    await expect(validateStructuredReferences(root, ["specs/index.json"])).rejects.toThrow(
      "resolves outside the repository",
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("reports malformed JSON and continues validating other documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-malformed-"));
  try {
    await writeFile(join(root, "invalid.json"), "{");
    await writeFile(join(root, "valid.json"), JSON.stringify({ path: "./missing.json" }));
    const result = await validateStructuredReferences(root, ["invalid.json", "valid.json"]);
    expect(result).toContain("invalid.json:");
    expect(result).toContain("missing.json");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

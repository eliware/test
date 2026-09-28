import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateStructuredReferences } from "../../../../src/checks/documentation/E-0.1.100/validate-structured-references.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("accepts local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "target.json"), "{}");
  await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./target.json" }));
  await expect(validateStructuredReferences(root, ["specs/index.json"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("skips non-file references while validating documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-url-"));
  try {
    await writeFile(
      join(root, "index.json"),
      JSON.stringify({ path: "https://example.test/reference.json" }),
    );
    await expect(validateStructuredReferences(root, ["index.json"])).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses cached JSON reads from the shared inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-inventory-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "target.json"), "{}");
  await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./target.json" }));
  const inventory = createRepositoryInventory(root);

  await expect(
    validateStructuredReferences(root, ["specs/index.json"], inventory),
  ).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("rejects missing local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-missing-"));
  await writeFile(join(root, "index.json"), JSON.stringify({ path: "./missing.json" }));
  await expect(validateStructuredReferences(root, ["index.json"])).resolves.toContain(
    "missing.json",
  );
  await rm(root, { recursive: true, force: true });
});

test("validates cross-repository references when the linked checkout is available", async () => {
  const parent = await mkdtemp(join(tmpdir(), "eliware-cross-repo-refs-"));
  const root = join(parent, "repository");
  const docs = join(parent, "docs");
  const registry = join(parent, "registry");
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(docs);
  await mkdir(registry);
  await writeFile(
    join(registry, "authority-map.json"),
    JSON.stringify({ repositoryRegistry: [{}, { path: "../docs" }] }),
  );
  await writeFile(join(docs, "authority-map.json"), "{}");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ globalAuthorityMap: "../../registry/authority-map.json" }),
  );
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      eliware: {
        crosslinks: [{ path: "../docs/authority-map.json" }, { path: "../docs" }],
      },
    }),
  );
  await expect(validateStructuredReferences(root, ["package.json"])).resolves.toBeNull();
  await rm(parent, { recursive: true, force: true });
});

test("rejects an external crosslink outside registered repository paths", async () => {
  const parent = await mkdtemp(join(tmpdir(), "eliware-unregistered-ref-"));
  const root = join(parent, "repository");
  const registry = join(parent, "registry");
  const docs = join(parent, "docs");
  const unregistered = join(parent, "unregistered");
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(registry);
  await mkdir(docs);
  await mkdir(unregistered);
  await writeFile(
    join(registry, "authority-map.json"),
    JSON.stringify({ repositoryRegistry: [{ path: "../docs" }] }),
  );
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ globalAuthorityMap: "../../registry/authority-map.json" }),
  );
  await writeFile(join(unregistered, "target.json"), "{}");
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ eliware: { crosslinks: [{ path: "../unregistered/target.json" }] } }),
  );
  await expect(validateStructuredReferences(root, ["package.json"])).resolves.toContain(
    "outside every registered repository path",
  );
  await rm(parent, { recursive: true, force: true });
});

test("reports independent invalid references in all documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-multiple-"));
  try {
    await writeFile(join(root, "first.json"), JSON.stringify({ path: "./missing-one.json" }));
    await writeFile(join(root, "second.json"), JSON.stringify({ path: "./missing-two.json" }));
    const result = await validateStructuredReferences(root, ["first.json", "second.json"]);
    expect(result).toContain("missing-one.json");
    expect(result).toContain("missing-two.json");
  } finally {
    await rm(root, { recursive: true, force: true });
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

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
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow("missing.json");
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

test("allows a registered cross-repository target when that checkout is unavailable", async () => {
  const parent = await mkdtemp(join(tmpdir(), "eliware-cross-repo-refs-missing-"));
  const root = join(parent, "repository");
  const registry = join(parent, "registry");
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(registry);
  await writeFile(
    join(registry, "authority-map.json"),
    JSON.stringify({ repositoryRegistry: [{ path: "../docs" }] }),
  );
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ globalAuthorityMap: "../../registry/authority-map.json" }),
  );
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ eliware: { crosslinks: [{ path: "../docs/authority-map.json" }] } }),
  );
  await expect(validateStructuredReferences(root, ["package.json"])).resolves.toBeNull();
  await rm(parent, { recursive: true, force: true });
});

test.each([false, true])(
  "validates repository registry paths with sibling checkout available: %s",
  async (siblingAvailable) => {
    const parent = await mkdtemp(join(tmpdir(), "eliware-repository-registry-refs-"));
    const root = join(parent, "repository");
    const sibling = join(parent, "operations");
    try {
      await mkdir(join(root, "specs"), { recursive: true });
      await writeFile(
        join(root, "specs", "authority.json"),
        JSON.stringify({ globalAuthorityMap: "../authority-map.json" }),
      );
      await writeFile(
        join(root, "authority-map.json"),
        JSON.stringify({
          repositoryRegistry: [
            {
              repository: "eliware/operations",
              path: "../operations",
              package: "../operations/package.json",
              authorityFile: "../operations/specs/authority.json",
              reference: "../operations/README.md",
            },
          ],
          structuredDocuments: [{ path: "../operations/specs/authority.json" }],
        }),
      );
      if (siblingAvailable) {
        await mkdir(join(sibling, "specs"), { recursive: true });
        await writeFile(join(sibling, "package.json"), "{}");
        await writeFile(join(sibling, "specs", "authority.json"), "{}");
        await writeFile(join(sibling, "README.md"), "# Operations");
      }
      await expect(
        validateStructuredReferences(root, ["specs/authority.json", "authority-map.json"]),
      ).resolves.toBeNull();
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  },
);

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
  await expect(validateStructuredReferences(root, ["package.json"])).rejects.toThrow(
    "outside every registered repository path",
  );
  await rm(parent, { recursive: true, force: true });
});

test.each([true, false])(
  "requires a registered map before accepting an external target (exists: %s)",
  async (targetExists) => {
    const parent = await mkdtemp(join(tmpdir(), "eliware-cross-repo-refs-no-map-"));
    const root = join(parent, "repository");
    const targetRoot = join(parent, targetExists ? "docs" : "missing-repository");
    try {
      await mkdir(root, { recursive: true });
      if (targetExists) {
        await mkdir(targetRoot);
        await writeFile(join(targetRoot, "target.json"), "{}");
      }
      const repositoryPath = targetExists
        ? "../docs/target.json"
        : "../missing-repository/target.json";
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          eliware: { crosslinks: [{ path: repositoryPath }] },
        }),
      );
      await expect(validateStructuredReferences(root, ["package.json"])).rejects.toThrow(
        join(root, "specs", "authority.json"),
      );
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  },
);

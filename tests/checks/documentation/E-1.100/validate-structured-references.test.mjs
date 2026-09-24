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
  await writeFile(
    join(root, "specs", "root-index.json"),
    JSON.stringify({ path: "/root-target.json" }),
  );
  await expect(validateStructuredReferences(root, ["specs/root-index.json"])).resolves.toBeNull();
  await writeFile(
    join(root, "specs", "parent-index.json"),
    JSON.stringify({ path: "../root-target.json" }),
  );
  await expect(validateStructuredReferences(root, ["specs/parent-index.json"])).resolves.toBeNull();
  await writeFile(
    join(root, "specs", "external-index.json"),
    JSON.stringify({ path: "https://example.test/reference.json" }),
  );
  await expect(
    validateStructuredReferences(root, ["specs/external-index.json"]),
  ).resolves.toBeNull();
  await writeFile(join(root, "specs", "empty-index.json"), JSON.stringify({ path: "#section" }));
  await expect(validateStructuredReferences(root, ["specs/empty-index.json"])).resolves.toBeNull();
  await writeFile(
    join(root, "specs", "nested-index.json"),
    JSON.stringify({ items: [{ path: "./target.json" }] }),
  );
  await expect(validateStructuredReferences(root, ["specs/nested-index.json"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("rejects missing local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-refs-missing-"));
  await writeFile(join(root, "index.json"), JSON.stringify({ path: "./missing.json" }));
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow("missing.json");
  await writeFile(join(root, "index.json"), JSON.stringify({ path: "../outside.json" }));
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow(
    "outside the repository",
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

test("does not allow external targets outside declared crosslinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-external-ref-"));
  await writeFile(
    join(root, "index.json"),
    JSON.stringify({ authority: { path: "../authority.json" } }),
  );
  await expect(validateStructuredReferences(root, ["index.json"])).rejects.toThrow(
    "resolves outside the repository",
  );
  await rm(root, { recursive: true, force: true });
});

test.each([
  ["missing global map path", JSON.stringify({ version: "8.0" }), null],
  [
    "invalid registry structure",
    JSON.stringify({ globalAuthorityMap: "../../registry/authority-map.json" }),
    JSON.stringify({}),
  ],
  ["unreadable registry", "{invalid", null],
])(
  "requires a usable authority registry for an existing external target (%s)",
  async (_label, authority, registry) => {
    const parent = await mkdtemp(join(tmpdir(), "eliware-cross-repo-refs-registry-"));
    const root = join(parent, "repository");
    const docs = join(parent, "docs");
    await mkdir(join(root, "specs"), { recursive: true });
    await mkdir(docs);
    await writeFile(join(docs, "target.json"), "{}");
    await writeFile(join(root, "specs", "authority.json"), authority);
    if (registry !== null) {
      await mkdir(join(parent, "registry"));
      await writeFile(join(parent, "registry", "authority-map.json"), registry);
    }
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ eliware: { crosslinks: [{ path: "../docs/target.json" }] } }),
    );
    await expect(validateStructuredReferences(root, ["package.json"])).rejects.toThrow(
      "cannot be verified without the registered repository map",
    );
    await rm(parent, { recursive: true, force: true });
  },
);

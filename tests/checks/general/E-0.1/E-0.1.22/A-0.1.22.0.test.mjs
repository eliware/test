import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import packageMetadata from "../../../../../package.json" with { type: "json" };
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.22/A-0.1.22.0.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");

async function fixture(directives) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await mkdir(join(root, "specs"));
  await writeFile(
    join(root, "specs", "directives.yaml"),
    JSON.stringify({ version: conventionVersion, description: "Fixture directives", directives }),
  );
  return root;
}

test("accepts a valid E-rooted directive tree", async () => {
  const root = await fixture([
    {
      id: "E-87.4",
      dos: ["Do the required work."],
      donts: ["Do not omit the work."],
      directives: [{ id: "A-87.4.1", dos: ["Act."], donts: ["Do not omit the action."] }],
    },
  ]);
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.22.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("maps document, empty-tree, and aggregated directive failures to the check result", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await expect(run({ root: missing })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("required and must be valid YAML"),
  });
  await rm(missing, { recursive: true, force: true });

  const empty = await fixture([]);
  await expect(run({ root: empty })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("one or more directives"),
  });
  await rm(empty, { recursive: true, force: true });

  const invalid = await fixture([{ id: "A-0.0", dos: ["Act."], donts: ["Do not omit action."] }]);
  await expect(run({ root: invalid })).resolves.toMatchObject({ status: "fail" });
  await rm(invalid, { recursive: true, force: true });

  const duplicate = await fixture([{ id: "E-0.0", dos: ["Do."], donts: ["Do not."] }]);
  await mkdir(join(duplicate, "specs", "conventions"));
  await writeFile(
    join(duplicate, "specs", "conventions", "general.yaml"),
    JSON.stringify({
      version: conventionVersion,
      description: "Fixture convention",
      directives: [{ id: "E-0.0", dos: ["Do."], donts: ["Do not."] }],
    }),
  );
  await expect(run({ root: duplicate })).resolves.toMatchObject({ status: "fail" });
  await rm(duplicate, { recursive: true, force: true });
});
test("reads directive YAML through the shared parsed cache", async () => {
  const root = await fixture([
    {
      id: "E-0.0",
      dos: ["Do."],
      donts: ["Do not."],
      directives: [{ id: "A-0.0.1", dos: ["Act."], donts: ["Do not."] }],
    },
  ]);
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  await expect(run({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  expect(reads.get(join(root, "specs", "directives.yaml"))).toBe(1);
  await rm(root, { recursive: true, force: true });
});

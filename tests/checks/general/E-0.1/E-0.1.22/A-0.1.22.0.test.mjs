import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import packageMetadata from "../../../../../package.json" with { type: "json" };
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.22/A-0.1.22.0.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");

async function fixture(directives) {
  const base = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  const root = join(base, "consumer");
  await mkdir(root);
  await mkdir(join(root, "specs"));
  await writeFile(
    join(root, "specs", "directives.yaml"),
    JSON.stringify({ version: conventionVersion, description: "Fixture directives", directives }),
  );
  return root;
}

const validate = (root, id = "E-87", extra = {}) =>
  run({
    root,
    packageJson: { name: "@eliware/example", eliware: { id, apply: ["general"] } },
    ...extra,
  });

async function cleanup(root) {
  await rm(join(root, ".."), { recursive: true, force: true });
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
  await expect(validate(root)).resolves.toEqual({
    ruleId: "A-0.1.22.0",
    status: "pass",
    message: "",
  });
  await cleanup(root);
});

test("maps document, empty-tree, and aggregated directive failures to the check result", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await expect(run({ root: missing })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("required and must be valid YAML"),
  });
  await rm(missing, { recursive: true, force: true });

  const empty = await fixture([]);
  await expect(validate(empty)).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("one or more directives"),
  });
  await cleanup(empty);

  const invalid = await fixture([{ id: "A-0.0", dos: ["Act."], donts: ["Do not omit action."] }]);
  await expect(validate(invalid)).resolves.toMatchObject({ status: "fail" });
  await cleanup(invalid);

  const duplicate = await fixture([{ id: "E-87.0", dos: ["Do."], donts: ["Do not."] }]);
  await mkdir(join(duplicate, "specs", "conventions"));
  await writeFile(
    join(duplicate, "specs", "conventions", "general.yaml"),
    JSON.stringify({
      version: conventionVersion,
      description: "Fixture convention",
      directives: [{ id: "E-87.0", dos: ["Do."], donts: ["Do not."] }],
    }),
  );
  await expect(validate(duplicate)).resolves.toMatchObject({ status: "fail" });
  await cleanup(duplicate);
});
test("reads directive YAML through the shared parsed cache", async () => {
  const root = await fixture([
    {
      id: "E-87.0",
      dos: ["Do."],
      donts: ["Do not."],
      directives: [{ id: "A-87.0.1", dos: ["Act."], donts: ["Do not."] }],
    },
  ]);
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  await expect(validate(root, "E-87", { repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  expect(reads.get(join(root, "specs", "directives.yaml"))).toBe(1);
  await cleanup(root);
});

test("rejects directive IDs outside the package E-number when the repo map is absent", async () => {
  const root = await fixture([{ id: "E-2", dos: ["Do."], donts: ["Do not."] }]);
  await expect(validate(root, "E-87")).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("assigned E-87 namespace"),
  });
  await cleanup(root);
});

test("uses the adjacent repo-map E-number as the namespace authority", async () => {
  const root = await fixture([{ id: "E-87", dos: ["Do."], donts: ["Do not."] }]);
  const docs = join(root, "..", "docs");
  await mkdir(docs);
  await writeFile(
    join(docs, "repo-map.yaml"),
    'repositories:\n  - id: "E-87"\n    repository: "eliware/example"\n',
  );
  await expect(validate(root, "E-2")).resolves.toMatchObject({ status: "pass" });
  await cleanup(root);
});

test("reports malformed repository maps and unusable fallback IDs", async () => {
  const invalidMapRoot = await fixture([{ id: "E-87", dos: ["Do."], donts: ["Do not."] }]);
  await mkdir(join(invalidMapRoot, "..", "docs"));
  await mkdir(join(invalidMapRoot, "..", "docs", "repo-map.yaml"));
  await expect(validate(invalidMapRoot)).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("repo-map.yaml could not be read"),
  });
  await cleanup(invalidMapRoot);

  const invalidIdRoot = await fixture([{ id: "E-87", dos: ["Do."], donts: ["Do not."] }]);
  await expect(validate(invalidIdRoot, "not-an-E-number")).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("E-number is required"),
  });
  await cleanup(invalidIdRoot);
});

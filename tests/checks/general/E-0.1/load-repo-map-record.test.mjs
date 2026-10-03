import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRepoMapRecord } from "../../../../src/checks/general/E-0.1/load-repo-map-record.mjs";

async function fixture(source) {
  const base = await mkdtemp(join(tmpdir(), "eliware-repo-map-"));
  const root = join(base, "consumer");
  await mkdir(root);
  if (source !== undefined) {
    const docs = join(base, "docs");
    await mkdir(docs);
    await writeFile(join(docs, "repo-map.yaml"), source);
  }
  return { base, root };
}

const record = {
  id: "E-7",
  repository: "eliware/example",
  description: "Example repository",
  keywords: "eliware, example",
  profiles: "general, application",
};

test("treats a missing sibling repo map as unavailable", async () => {
  const { base, root } = await fixture();
  expect(loadRepoMapRecord(root, { name: "@eliware/example" })).toEqual({
    available: false,
    record: null,
    error: null,
  });
  await rm(base, { recursive: true, force: true });
});

test("finds the package's repository record by scoped package name", async () => {
  const { base, root } = await fixture(JSON.stringify({ repositories: [null, record] }));
  expect(loadRepoMapRecord(root, { name: "@eliware/example" })).toEqual({
    available: true,
    record,
    error: null,
  });
  await rm(base, { recursive: true, force: true });
});

test("reports a present repo-map path that cannot be read", async () => {
  const { base, root } = await fixture();
  const docs = join(base, "docs");
  await mkdir(docs);
  await mkdir(join(docs, "repo-map.yaml"));
  expect(loadRepoMapRecord(root, { name: "@eliware/example" }).error).toContain(
    "could not be read",
  );
  await rm(base, { recursive: true, force: true });
});

test("reports when package name is missing while the repo map is present", async () => {
  const { base, root } = await fixture(JSON.stringify({ repositories: [record] }));
  expect(loadRepoMapRecord(root, {}).error).toContain("cannot identify");
  await rm(base, { recursive: true, force: true });
});

test.each([
  ["invalid YAML", "repositories: [", "invalid YAML"],
  ["null repository map", "null", "repositories array"],
  ["missing repository records", "{}", "repositories array"],
  ["invalid package name", JSON.stringify({ repositories: [record] }), "cannot identify"],
  ["missing matching record", JSON.stringify({ repositories: [] }), "no entry"],
])("reports %s when the repo map is present", async (_label, source, expected) => {
  const { base, root } = await fixture(source);
  const packageJson = { name: "@eliware/example" };
  if (_label === "invalid package name") packageJson.name = "example";
  expect(loadRepoMapRecord(root, packageJson).error).toContain(expected);
  await rm(base, { recursive: true, force: true });
});

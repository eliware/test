import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRepoMapRecord } from "../../../../src/checks/general/E-0.1.0.1.0/load-repo-map-record.mjs";

test("reports an absent repo map as optional", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-map-"));
  try {
    expect(await loadRepoMapRecord(root, {})).toEqual({
      available: false,
      record: null,
      error: null,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports repository map read failures", async () => {
  const read = async () => {
    const error = new Error("denied");
    error.code = "EACCES";
    throw error;
  };
  await expect(loadRepoMapRecord("/repo", {}, { read })).resolves.toMatchObject({
    available: true,
    record: null,
    error: "repo-map.yaml could not be read: denied",
  });
});

test("loads the package repository record", async () => {
  const base = await mkdtemp(join(tmpdir(), "eliware-map-"));
  const root = join(base, "repo");
  const docs = join(base, "docs");
  await mkdir(root);
  await mkdir(docs, { recursive: true });
  try {
    await writeFile(
      join(docs, "repo-map.yaml"),
      "repositories:\n  - repository: eliware/example\n    id: E-1\n",
    );
    expect(await loadRepoMapRecord(root, { name: "@eliware/example" })).toMatchObject({
      available: true,
      record: { id: "E-1" },
      error: null,
    });
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test.each([
  ["repositories: bad", "repositories array"],
  ["repositories: [", "invalid YAML"],
])("reports invalid repository map data", async (source, expected) => {
  const base = await mkdtemp(join(tmpdir(), "eliware-map-"));
  const root = join(base, "repo");
  const docs = join(base, "docs");
  await mkdir(root);
  await mkdir(docs);
  try {
    await writeFile(join(docs, "repo-map.yaml"), source);
    expect((await loadRepoMapRecord(root, { name: "@eliware/example" })).error).toContain(expected);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("reports invalid package names and missing map entries", async () => {
  const base = await mkdtemp(join(tmpdir(), "eliware-map-"));
  const root = join(base, "repo");
  const docs = join(base, "docs");
  await mkdir(root);
  await mkdir(docs);
  try {
    await writeFile(join(docs, "repo-map.yaml"), "repositories: []\n");
    expect((await loadRepoMapRecord(root, { name: "example" })).error).toContain("cannot identify");
    expect((await loadRepoMapRecord(root, { name: "@eliware/other" })).error).toContain("no entry");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

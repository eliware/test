import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { loadRepoMapRecord } =
  await import("../../../../../src/checks/general/E-0.1.0.1.0/load-repo-map/record.mjs");

const mapReader = (mapSource) => async (path) => {
  if (String(path).endsWith("repo-map-schema.yaml")) {
    const error = new Error("not found");
    error.code = "ENOENT";
    throw error;
  }
  return mapSource;
};

const schemaReader = (mapSource, schemaSource) => async (path) =>
  String(path).endsWith("repo-map-schema.yaml") ? schemaSource : mapSource;

test("reports an absent repo map as optional", async () => {
  const read = async () => {
    const error = new Error("not found");
    error.code = "ENOENT";
    throw error;
  };
  expect(await loadRepoMapRecord("repo", {}, { read })).toEqual({
    available: false,
    record: null,
    error: null,
  });
});

test("uses the default file reader when no reader is provided", async () => {
  const missing = Object.assign(new Error("not found"), { code: "ENOENT" });
  readFile.mockRejectedValue(missing);
  await expect(loadRepoMapRecord("repo", {})).resolves.toEqual({
    available: false,
    record: null,
    error: null,
  });
  expect(readFile).toHaveBeenCalledTimes(1);
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
  const read = mapReader("repositories:\n  - repository: eliware/example\n    id: E-1\n");
  expect(await loadRepoMapRecord("repo", { name: "@eliware/example" }, { read })).toMatchObject({
    available: true,
    record: { id: "E-1" },
    error: null,
  });
});

test("accepts long descriptive fields in the external repository map", async () => {
  const read = mapReader(
    `repositories:\n  - repository: eliware/example\n    description: ${"x".repeat(150)}\n`,
  );
  await expect(
    loadRepoMapRecord("repo", { name: "@eliware/example" }, { read }),
  ).resolves.toMatchObject({
    available: true,
    record: { repository: "eliware/example" },
    error: null,
  });
});

test("rejects duplicate repository records", async () => {
  const read = mapReader(
    "repositories:\n  - repository: eliware/example\n    id: E-1\n  - repository: eliware/example\n    id: E-2\n",
  );
  await expect(
    loadRepoMapRecord("repo", { name: "@eliware/example" }, { read }),
  ).resolves.toMatchObject({
    available: true,
    record: null,
    error: "repo-map.yaml has duplicate entries for eliware/example.",
  });
});

test("counts repository records in every YAML stream document", async () => {
  const read = mapReader(
    "repositories: []\n---\nrepositories:\n  - repository: eliware/example\n    id: E-1\n",
  );
  await expect(
    loadRepoMapRecord("repo", { name: "@eliware/example" }, { read }),
  ).resolves.toMatchObject({ record: { id: "E-1" }, error: null });
});

test.each([
  ["repositories: bad", "repositories array"],
  ["repositories: [", "invalid YAML"],
])("reports invalid repository map data", async (source, expected) => {
  const read = mapReader(source);
  expect((await loadRepoMapRecord("repo", { name: "@eliware/example" }, { read })).error).toContain(
    expected,
  );
});

test("reports invalid package names and allows missing map entries", async () => {
  const read = mapReader("repositories: []\n");
  expect((await loadRepoMapRecord("repo", { name: "example" }, { read })).error).toContain(
    "cannot identify",
  );
  expect(await loadRepoMapRecord("repo", { name: "@eliware/other" }, { read })).toEqual({
    available: true,
    record: null,
    error: null,
  });
});

test("reports missing package metadata when a repository map exists", async () => {
  await expect(
    loadRepoMapRecord("repo", {}, { read: mapReader("repositories: []\n") }),
  ).resolves.toMatchObject({
    available: true,
    record: null,
    error: "The package name cannot identify a repo-map entry.",
  });
});

test("rejects invalid map data before it selects a repository record", async () => {
  const schema =
    "type: object\nrequired: [repositories]\nproperties:\n  repositories: {type: array}\nadditionalProperties: false\n";
  const result = await loadRepoMapRecord(
    "repo",
    { name: "@eliware/example" },
    { read: schemaReader("repositories: []\nextra: true\n", schema) },
  );
  expect(result.record).toBeNull();
  expect(result.error).toContain("does not match repo-map-schema.yaml");
});

test("uses matching records after optional schema validation", async () => {
  const schema =
    "type: object\nrequired: [repositories]\nproperties:\n  repositories: {type: array}\nadditionalProperties: false\n";
  const result = await loadRepoMapRecord(
    "repo",
    { name: "@eliware/example" },
    {
      read: schemaReader("repositories:\n  - repository: eliware/example\n", schema),
    },
  );
  expect(result).toEqual({
    available: true,
    record: { repository: "eliware/example" },
    error: null,
  });
});

test("rejects an invalid adjacent schema before record lookup", async () => {
  const result = await loadRepoMapRecord(
    "repo",
    { name: "@eliware/example" },
    { read: schemaReader("repositories: []\n", "type: [\n") },
  );
  expect(result.record).toBeNull();
  expect(result.error).toContain("repo-map-schema.yaml is invalid YAML");
});

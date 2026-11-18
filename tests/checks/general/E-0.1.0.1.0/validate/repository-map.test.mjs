import { beforeEach, expect, jest, test } from "@jest/globals";
const loadRepoMapRecord = jest.fn();
const compareRepoMapRecord = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1.0.1.0/load-repo-map/record.mjs",
  () => ({
    loadRepoMapRecord,
    default: loadRepoMapRecord,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1.0.1.0/validate/compare-repo-map-record.mjs",
  () => ({
    compareRepoMapRecord,
    default: compareRepoMapRecord,
  }),
);
const validateRepositoryMap = (
  await import("../../../../../src/checks/general/E-0.1.0.1.0/validate/repository-map.mjs")
).default;
beforeEach(() => {
  loadRepoMapRecord.mockReset();
  compareRepoMapRecord.mockReset().mockReturnValue([]);
});
test("returns load errors with record comparison results", async () => {
  loadRepoMapRecord.mockResolvedValue({
    error: "map unreadable",
  });
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual(["map unreadable"]);
  expect(compareRepoMapRecord).toHaveBeenCalledWith(
    {},
    {
      error: "map unreadable",
    },
  );
});
test("returns repository map comparison errors", async () => {
  const map = {
    available: true,
    record: {
      repository: "eliware/example",
    },
    error: null,
  };
  loadRepoMapRecord.mockResolvedValue(map);
  compareRepoMapRecord.mockReturnValue(["metadata mismatch"]);
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual(["metadata mismatch"]);
});
test("adds the loaded map hash to exemption mismatch diagnostics", async () => {
  loadRepoMapRecord.mockResolvedValue({
    sourceHash: "a".repeat(64),
  });
  compareRepoMapRecord.mockReturnValue([
    "The package exemption list must match repo-map.yaml.\npackage list\nmap list",
  ]);
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual([
    "The package exemption list must match repo-map.yaml.\npackage list\nmap list",
    `repo-map.yaml SHA-256: ${"a".repeat(64)}`,
  ]);
});
test("does not add the map hash to other validation errors", async () => {
  loadRepoMapRecord.mockResolvedValue({
    sourceHash: "a".repeat(64),
  });
  compareRepoMapRecord.mockReturnValue(["metadata mismatch"]);
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual(["metadata mismatch"]);
});
test("accepts an unavailable repository map", async () => {
  loadRepoMapRecord.mockResolvedValue({
    available: false,
    record: null,
    error: null,
  });
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual([]);
});

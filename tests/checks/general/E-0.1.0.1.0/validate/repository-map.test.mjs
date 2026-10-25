import { beforeEach, expect, jest, test } from "@jest/globals";

const loadRepoMapRecord = jest.fn();
const compareRepoMapRecord = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1.0.1.0/load-repo-map/record.mjs",
  () => ({ loadRepoMapRecord }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1.0.1.0/validate/compare-repo-map-record.mjs",
  () => ({ compareRepoMapRecord }),
);
const { validateRepositoryMap } =
  await import("../../../../../src/checks/general/E-0.1.0.1.0/validate/repository-map.mjs");

beforeEach(() => {
  loadRepoMapRecord.mockReset();
  compareRepoMapRecord.mockReset().mockReturnValue([]);
});

test("returns load errors with record comparison results", async () => {
  loadRepoMapRecord.mockResolvedValue({ error: "map unreadable" });
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual(["map unreadable"]);
  expect(compareRepoMapRecord).toHaveBeenCalledWith({}, { error: "map unreadable" });
});

test("returns repository map comparison errors", async () => {
  const map = { available: true, record: { repository: "eliware/example" }, error: null };
  loadRepoMapRecord.mockResolvedValue(map);
  compareRepoMapRecord.mockReturnValue(["metadata mismatch"]);
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual(["metadata mismatch"]);
});

test("accepts an unavailable repository map", async () => {
  loadRepoMapRecord.mockResolvedValue({ available: false, record: null, error: null });
  await expect(validateRepositoryMap("repo", {})).resolves.toEqual([]);
});

import { beforeEach, expect, jest, test } from "@jest/globals";

const validateProfileDocumentPairs = jest.fn();
const loadRepoMapRecord = jest.fn();
const compareRepoMapRecord = jest.fn();

jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.0/validate/profile-document-pairs.mjs",
  () => ({
    validateProfileDocumentPairs,
  }),
);
jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.0/load-repo-map/record.mjs",
  () => ({
    loadRepoMapRecord,
  }),
);
jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.0/validate/compare-repo-map-record.mjs",
  () => ({
    compareRepoMapRecord,
  }),
);

const { run, ruleId } = await import("../../../src/checks/general/E-0.1.0.1.0.mjs");

const packageJson = { name: "@eliware/example", eliware: { id: "E-1", apply: ["general"] } };

beforeEach(() => {
  validateProfileDocumentPairs.mockReset().mockResolvedValue([]);
  loadRepoMapRecord.mockReset().mockResolvedValue({ available: false, record: null, error: null });
  compareRepoMapRecord.mockReset().mockReturnValue([]);
});

test("passes when metadata and optional repository data are valid", async () => {
  await expect(run({ root: "repo", packageJson })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(loadRepoMapRecord).toHaveBeenCalledWith("repo", packageJson);
});

test("uses the current directory when context has no root", async () => {
  await run({ packageJson });
  expect(loadRepoMapRecord).toHaveBeenCalledWith(process.cwd(), packageJson);
});

test("uses default context values when the rule receives no argument", async () => {
  await run();
  expect(loadRepoMapRecord).toHaveBeenCalledWith(process.cwd(), undefined);
});

test("reports invalid repository map data and comparison errors", async () => {
  loadRepoMapRecord.mockResolvedValue({ available: true, record: null, error: "invalid map" });
  compareRepoMapRecord.mockReturnValue(["metadata mismatch"]);
  const result = await run({ root: "repo", packageJson });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("invalid map");
  expect(result.message).toContain("metadata mismatch");
});

test("reports invalid Eliware metadata", async () => {
  const result = await run({ packageJson: { eliware: { apply: ["general"], extra: true } } });
  expect(result).toMatchObject({ status: "fail" });
  expect(result.message).toContain("ordered keys");
});

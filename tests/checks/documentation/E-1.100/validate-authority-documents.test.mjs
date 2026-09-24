import { beforeEach, expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const validateAuthorityRecord = jest.fn();
const validateAuthorityMap = jest.fn();
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/validate-authority-record.mjs", () => ({ validateAuthorityRecord }));
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/validate-authority-map.mjs", () => ({ validateAuthorityMap }));
const { validateAuthorityDocuments } = await import("../../../../src/checks/documentation/E-1.100/validate-authority-documents.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validateAuthorityRecord.mockResolvedValue(null);
  validateAuthorityMap.mockResolvedValue(null);
});

test("ignores unrelated JSON documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "other.json"), "{}\n");
  await expect(validateAuthorityDocuments(root, ["specs/other.json"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("dispatches authority records and maps to their specialized validators", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "{}\n");
  await writeFile(join(root, "authority-map.json"), "{}\n");

  validateAuthorityRecord.mockResolvedValueOnce("record invalid");
  await expect(validateAuthorityDocuments(root, ["specs/authority.json"])).resolves.toBe("record invalid");
  expect(validateAuthorityRecord).toHaveBeenCalledWith(expect.objectContaining({
    root,
    document: {},
  }));

  validateAuthorityMap.mockResolvedValueOnce("map invalid");
  await expect(validateAuthorityDocuments(root, ["authority-map.json"])).resolves.toBe("map invalid");
  expect(validateAuthorityMap).toHaveBeenCalledWith(expect.objectContaining({
    root,
    document: {},
  }));
  await rm(root, { recursive: true, force: true });
});

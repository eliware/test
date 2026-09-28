import { beforeEach, expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const validateAuthorityRecord = jest.fn();
const validateAuthorityMap = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-record.mjs",
  () => ({ validateAuthorityRecord }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-map.mjs",
  () => ({ validateAuthorityMap }),
);
const { validateAuthorityDocuments } =
  await import("../../../../src/checks/documentation/E-0.1.100/validate-authority-documents.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validateAuthorityRecord.mockResolvedValue(null);
  validateAuthorityMap.mockResolvedValue(null);
});
test("uses the inventory parsed-document cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-inventory-"));
  await writeFile(join(root, "other.json"), "{}\n");
  const inventory = { readParsed: jest.fn(async () => ({})) };

  await expect(validateAuthorityDocuments(root, ["other.json"], inventory)).resolves.toBeNull();
  expect(inventory.readParsed).toHaveBeenCalledWith(join(root, "other.json"), "json", JSON.parse);
  await rm(root, { recursive: true, force: true });
});

test("dispatches authority records and maps to their specialized validators", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "{}\n");
  await writeFile(join(root, "authority-map.json"), "{}\n");

  validateAuthorityRecord.mockResolvedValueOnce("record invalid");
  await expect(validateAuthorityDocuments(root, ["specs/authority.json"])).resolves.toBe(
    "specs/authority.json: record invalid",
  );
  expect(validateAuthorityRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      root,
      document: {},
    }),
  );

  validateAuthorityMap.mockResolvedValueOnce("map invalid");
  await expect(validateAuthorityDocuments(root, ["authority-map.json"])).resolves.toBe(
    "authority-map.json: map invalid",
  );
  expect(validateAuthorityMap).toHaveBeenCalledWith(
    expect.objectContaining({
      root,
      document: {},
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports every invalid authority document", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-multiple-"));
  try {
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "specs", "authority.json"), "{}\n");
    await writeFile(join(root, "authority-map.json"), "{}\n");
    validateAuthorityRecord.mockResolvedValueOnce("record invalid");
    validateAuthorityMap.mockResolvedValueOnce("map invalid");
    await expect(
      validateAuthorityDocuments(root, ["specs/authority.json", "authority-map.json"]),
    ).resolves.toBe("specs/authority.json: record invalid\nauthority-map.json: map invalid");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports malformed authority JSON while checking other documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-docs-malformed-"));
  try {
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "specs", "authority.json"), "{");
    await writeFile(join(root, "authority-map.json"), "{}\n");
    validateAuthorityMap.mockResolvedValueOnce("map invalid");
    const result = await validateAuthorityDocuments(root, [
      "specs/authority.json",
      "authority-map.json",
    ]);
    expect(result).toContain("specs/authority.json:");
    expect(result).toContain("authority-map.json: map invalid");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("loads registered repository roots once for multiple authority records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-authority-roots-cache-"));
  try {
    const authorityPath = join(root, "specs", "authority.json");
    const mapPath = join(root, "authority-map.json");
    const authority = { globalAuthorityMap: "../authority-map.json" };
    const inventory = {
      readParsed: jest.fn(async (file) =>
        file === mapPath ? { repositoryRegistry: [] } : authority,
      ),
    };

    await validateAuthorityDocuments(
      root,
      ["specs/authority.json", "project/specs/authority.json"],
      inventory,
    );

    expect(inventory.readParsed.mock.calls.filter(([file]) => file === authorityPath)).toHaveLength(
      2,
    );
    expect(inventory.readParsed.mock.calls.filter(([file]) => file === mapPath)).toHaveLength(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

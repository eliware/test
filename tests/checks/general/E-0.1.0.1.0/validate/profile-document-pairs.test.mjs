import { beforeEach, expect, jest, test } from "@jest/globals";

const readdir = jest.fn();
const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readdir, readFile }));

const { validateProfileDocumentPairs } =
  await import("../../../../../src/checks/general/E-0.1.0.1.0/validate/profile-document-pairs.mjs");

const version = "15.0";

beforeEach(() => {
  readdir.mockReset();
  readFile.mockReset();
});

test("accepts a missing bundled directory", async () => {
  readdir.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  await expect(validateProfileDocumentPairs({ directory: "C:/missing" })).resolves.toEqual([]);
});

test("reports bundled directory access failures", async () => {
  readdir.mockRejectedValue(new Error("blocked"));
  await expect(validateProfileDocumentPairs()).rejects.toThrow("blocked");
});

test("reads bundled profiles instead of consumer profile files", async () => {
  readdir.mockResolvedValue(["general-semantic.yaml", "general-deterministic.yaml"]);
  readFile.mockResolvedValue(`version: '${version}'\n`);

  await expect(validateProfileDocumentPairs()).resolves.toEqual([]);
  expect(readdir).toHaveBeenCalledWith(expect.any(URL));
  expect(readFile).toHaveBeenCalledTimes(2);
});

test("reports paired version mismatches", async () => {
  readdir.mockResolvedValue(["general-semantic.yaml", "general-deterministic.yaml"]);
  readFile.mockImplementation(async (path) =>
    path.endsWith("semantic.yaml") ? `version: '${version}'\n` : `version: '${version}.1'\n`,
  );

  await expect(validateProfileDocumentPairs({ directory: "C:/profiles" })).resolves.toEqual([
    "general semantic and deterministic documents must use the same version.",
  ]);
});

test.each(["database-semantic.yaml", "general-deterministic.yaml"])(
  "allows a profile with one convention stream: %s",
  async (name) => {
    readdir.mockResolvedValue([name, "README.md"]);
    readFile.mockResolvedValue(`version: '${version}'\n`);

    await expect(validateProfileDocumentPairs({ directory: "C:/profiles" })).resolves.toEqual([]);
  },
);

test("ignores unrelated files when all profile documents are paired", async () => {
  readdir.mockResolvedValue(["general-semantic.yaml", "general-deterministic.yaml", "README.md"]);
  readFile.mockResolvedValue(`version: '${version}'\n`);

  await expect(validateProfileDocumentPairs({ directory: "C:/profiles" })).resolves.toEqual([]);
});

test("rejects malformed YAML and mismatched stream lengths", async () => {
  readdir.mockResolvedValue(["general-semantic.yaml"]);
  readFile.mockResolvedValue("version: [\n");
  await expect(validateProfileDocumentPairs({ directory: "C:/profiles" })).rejects.toThrow();

  readdir.mockResolvedValue(["general-semantic.yaml", "general-deterministic.yaml"]);
  readFile.mockResolvedValueOnce(`version: '${version}'\n---\nversion: '${version}'\n`);
  readFile.mockResolvedValueOnce(`version: '${version}'\n`);
  await expect(validateProfileDocumentPairs({ directory: "C:/profiles" })).resolves.toContain(
    "general semantic and deterministic documents must use the same stream length.",
  );
});

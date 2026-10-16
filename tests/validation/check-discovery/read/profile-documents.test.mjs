import { beforeEach, expect, jest, test } from "@jest/globals";
import { fileURLToPath } from "node:url";

const readdirSync = jest.fn();
const readFileSync = jest.fn();

jest.unstable_mockModule("node:fs", () => ({ readdirSync, readFileSync }));

const { readProfileDocuments } =
  await import("../../../../src/validation/check-discovery/read/profile-documents.mjs");

const directory = "C:/profiles";
const file = (name) => ({ name, isFile: () => true });
const folder = (name) => ({ name, isFile: () => false });

beforeEach(() => {
  readdirSync
    .mockReset()
    .mockReturnValue([
      file("zeta-semantic.yaml"),
      file("alpha-deterministic.yaml"),
      file("alpha-semantic.yaml"),
      file("directives.yaml"),
      file("notes.md"),
      folder("nested"),
    ]);
  readFileSync.mockReset().mockImplementation((path) => {
    if (path.endsWith("alpha-deterministic.yaml")) return '{"name":"alpha"}';
    if (path.endsWith("alpha-semantic.yaml")) return '{"name":"alpha"}';
    if (path.endsWith("zeta-semantic.yaml")) return '{"name":"zeta"}';
    throw new Error(`Unexpected read: ${path}`);
  });
});

test("reads profile YAML in sorted order and excludes maintenance documents", () => {
  expect(readProfileDocuments(directory)).toEqual([
    { source: "alpha-deterministic.yaml", document: { name: "alpha" } },
    { source: "alpha-semantic.yaml", document: { name: "alpha" } },
    { source: "zeta-semantic.yaml", document: { name: "zeta" } },
  ]);
  expect(readdirSync).toHaveBeenCalledWith(directory, { withFileTypes: true });
  expect(readFileSync).toHaveBeenCalledTimes(3);
});

test("reads profile YAML from a file URL", () => {
  expect(readProfileDocuments(new URL("file:///C:/profiles"))).toHaveLength(3);
  expect(readdirSync).toHaveBeenCalledWith(fileURLToPath(new URL("file:///C:/profiles")), {
    withFileTypes: true,
  });
});

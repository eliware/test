import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const readdir = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, readdir }));

const { readSpecificationHeadings } =
  await import("../../../../src/checks/shared/E-0.1.0.1.2/read-specification-headings.mjs");

const file = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const directory = (name) => ({ name, isDirectory: () => true, isFile: () => false });
const root = "C:/repo";

beforeEach(() => {
  readFile.mockReset();
  readdir.mockReset();
});

test("returns no headings when specs are absent", async () => {
  readdir.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
});

test("reads headings declared in nested directive requirements", async () => {
  readdir
    .mockResolvedValueOnce([directory("profiles")])
    .mockResolvedValueOnce([file("rules.yaml")]);
  readFile.mockResolvedValue(
    'directives:\n  - dos:\n      - "## Project"\n    children:\n      - dos:\n          - "## Nested"\n',
  );
  await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set(["Project", "Nested"]));
});

test("ignores headings in examples and YAML files without directive arrays", async () => {
  readdir.mockResolvedValueOnce([file("README.md"), file("profile.yaml")]);
  readFile.mockResolvedValue("metadata: true\n");
  await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
  expect(readFile).toHaveBeenCalledTimes(1);
});

test("reads declared headings from every YAML stream document", async () => {
  readdir.mockResolvedValueOnce([file("profile.yaml")]);
  readFile.mockResolvedValue(
    'directives:\n  - dos:\n      - "## First"\n---\ndirectives:\n  - dos:\n      - "## Second"\n',
  );
  await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set(["First", "Second"]));
});

test("reports listing, read, and malformed YAML errors", async () => {
  readdir.mockRejectedValueOnce(new Error("blocked"));
  await expect(readSpecificationHeadings(root)).rejects.toThrow("blocked");
  readdir.mockResolvedValueOnce([file("valid.yaml")]);
  readFile.mockRejectedValueOnce(new Error("read failed"));
  await expect(readSpecificationHeadings(root)).rejects.toThrow("read failed");
  readdir.mockResolvedValueOnce([file("invalid.yaml")]);
  readFile.mockResolvedValueOnce("directives: [\n");
  await expect(readSpecificationHeadings(root)).rejects.toThrow();
});

test("ignores invalid directive fields and null YAML documents", async () => {
  readdir.mockResolvedValueOnce([file("profile.yaml")]);
  readFile.mockResolvedValue(
    "null\n---\ndirectives: null\n---\ndirectives: [null, { dos: [null, invalid] }]\n",
  );
  await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
});

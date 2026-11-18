import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
const readdir = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({
  readdir,
  default: readdir,
}));
const findMarkdownFiles = (
  await import("../../../../src/checks/general/E-0.1.0.1.4/find-markdown-files.mjs")
).default;
const root = "C:/repo";
const file = (name) => ({
  name,
  isDirectory: () => false,
  isFile: () => true,
});
const directory = (name) => ({
  name,
  isDirectory: () => true,
  isFile: () => false,
});
beforeEach(() => readdir.mockReset());
test("finds Markdown files and skips generated folders", async () => {
  readdir.mockImplementation(async (path) => {
    if (path === root)
      return [
        directory("docs"),
        directory("node_modules"),
        directory("artifacts"),
        file("README.md"),
        file("notes.txt"),
      ];
    if (path === join(root, "docs")) return [file("guide.MD"), directory("artifacts")];
    throw new Error(`Unexpected directory read: ${path}`);
  });
  await expect(findMarkdownFiles(root)).resolves.toEqual(["README.md", "docs/guide.MD"]);
});
test("skips Git-ignored folders at nested levels", async () => {
  readdir.mockImplementation(async (path) => {
    if (path === root) return [directory("docs"), directory("local-output")];
    if (path === join(root, "docs")) return [file("guide.md")];
    if (path === join(root, "local-output")) return [file("private.md")];
    throw new Error(`Unexpected directory read: ${path}`);
  });
  await expect(
    findMarkdownFiles(root, root, undefined, new Set(["local-output"])),
  ).resolves.toEqual(["docs/guide.md"]);
});
test("limits traversal depth and entry count", async () => {
  let depth = 0;
  readdir.mockImplementation(async () => {
    depth += 1;
    return [directory("nested")];
  });
  await expect(findMarkdownFiles(root)).rejects.toThrow("128-level depth limit");
  readdir.mockResolvedValue(
    Array.from(
      {
        length: 10_001,
      },
      (_, index) => file(`file-${index}.md`),
    ),
  );
  await expect(findMarkdownFiles(root)).rejects.toThrow("10000-entry limit");
});

import { expect, jest, test } from "@jest/globals";
const readFile = jest.fn();
const stat = jest.fn();
const realpath = jest.fn();
const findMarkdownFiles = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, stat, realpath }));
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1.0.1.4/find-markdown-files.mjs",
  () => ({ findMarkdownFiles }),
);
const { validateMarkdownLinks } =
  await import("../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown-links.mjs");

const root = "/repo";
const contextFor = (files) => ({
  repositoryInventory: {
    documentationFiles: jest.fn(async ({ predicate }) => files.filter(predicate)),
  },
});
const dependencies = (
  read = jest.fn(async () => ""),
  stat = jest.fn(async () => ({
    isFile: () => true,
    isDirectory: () => false,
  })),
) => ({ read, stat, realpath: jest.fn(async (path) => path) });

test("accepts valid local and external links and reads fragment targets", async () => {
  const read = jest
    .fn()
    .mockResolvedValueOnce(
      '[target](target.md#target) ![asset](image.png) <img src="image.png"> <https://example.com>',
    )
    .mockResolvedValueOnce("## Target");
  await expect(
    validateMarkdownLinks(root, contextFor(["README.md"]), dependencies(read)),
  ).resolves.toEqual([]);
  expect(read).toHaveBeenCalledTimes(2);
});

test("uses the default repository reader when no inventory is provided", async () => {
  findMarkdownFiles.mockResolvedValueOnce(["README.md"]);
  readFile.mockResolvedValueOnce("No links.");
  await expect(validateMarkdownLinks(root)).resolves.toEqual([]);
  expect(findMarkdownFiles).toHaveBeenCalledWith(root);
});

test("reports missing markdown inventories and unreadable documents", async () => {
  await expect(
    validateMarkdownLinks(root, {
      repositoryInventory: {
        documentationFiles: async () => {
          throw new Error("blocked");
        },
      },
    }),
  ).resolves.toEqual(["Markdown files could not be listed: blocked"]);
  await expect(
    validateMarkdownLinks(
      root,
      contextFor(["README.md"]),
      dependencies(async () => {
        throw new Error("denied");
      }),
    ),
  ).resolves.toEqual(["README.md could not be read: denied"]);
});

test("reports missing shortcut references and invalid external URLs", async () => {
  const read = jest.fn().mockResolvedValue("[missing][reference] <http://github.com/owner/repo>");
  const errors = await validateMarkdownLinks(root, contextFor(["README.md"]), dependencies(read));
  expect(errors).toContain("Markdown reference link has no definition in README.md.");
  expect(errors).toContain(
    "Documentation link is invalid: http://github.com/owner/repo. in README.md.",
  );
});

test("reports missing local targets and unresolved fragments", async () => {
  const read = jest
    .fn()
    .mockResolvedValueOnce("[missing](missing.md) [fragment](target.md#absent)")
    .mockResolvedValueOnce("## Present");
  const stat = jest.fn(async (path) => {
    if (path.endsWith("missing.md")) throw new Error("missing");
    return { isFile: () => true, isDirectory: () => false };
  });
  const errors = await validateMarkdownLinks(
    root,
    contextFor(["README.md"]),
    dependencies(read, stat),
  );
  expect(errors).toContain("Documentation link does not resolve: missing.md in README.md.");
  expect(errors).toContain(
    "Documentation fragment does not resolve: target.md#absent in README.md.",
  );
});

test("rejects links that escape the repository before resolving them", async () => {
  const read = jest.fn().mockResolvedValue("[outside](../../outside.md)");
  const deps = dependencies(read);
  await expect(validateMarkdownLinks(root, contextFor(["README.md"]), deps)).resolves.toEqual([
    "Documentation link escapes the repository: ../../outside.md in README.md.",
  ]);
  expect(deps.realpath).not.toHaveBeenCalled();
});

import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const stat = jest.fn();
const realpath = jest.fn();
const findMarkdownFiles = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, stat, realpath }));
jest.unstable_mockModule(
  "../../../../../../src/checks/general/E-0.1.0.1.4/find-markdown-files.mjs",
  () => ({ findMarkdownFiles }),
);
const { validateMarkdownLinks } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown/links.mjs");

const root = "/repo";
const dependencies = (overrides = {}) => ({
  read: jest.fn(async () => "No links."),
  stat: jest.fn(async () => ({ isFile: () => true, isDirectory: () => false })),
  realpath: jest.fn(async (path) => path),
  ...overrides,
});

test("uses the default repository reader when no inventory is provided", async () => {
  findMarkdownFiles.mockResolvedValueOnce(["README.md"]);
  readFile.mockResolvedValueOnce("No links.");
  await expect(validateMarkdownLinks(root)).resolves.toEqual([]);
  expect(findMarkdownFiles).toHaveBeenCalledWith(root);
});

test("aggregates validation results for each discovered document", async () => {
  const inventory = {
    documentationFiles: jest.fn(async ({ predicate }) =>
      ["README.md", "guide.md", "notes.txt"].filter(predicate),
    ),
  };
  const read = jest.fn(async (path) =>
    path.endsWith("README.md") ? "[one](one.md)" : "[two](two.md)",
  );
  const deps = dependencies({
    read,
    stat: async () => {
      throw new Error("missing");
    },
  });
  const errors = await validateMarkdownLinks(root, { repositoryInventory: inventory }, deps);
  expect(errors).toEqual([
    "Documentation link does not resolve: one.md in README.md.",
    "Documentation link does not resolve: two.md in guide.md.",
  ]);
});

test("reports inventory and document read failures", async () => {
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
      { repositoryInventory: { documentationFiles: async () => ["README.md"] } },
      dependencies({
        read: async () => {
          throw new Error("denied");
        },
      }),
    ),
  ).resolves.toEqual(["README.md could not be read: denied"]);
});

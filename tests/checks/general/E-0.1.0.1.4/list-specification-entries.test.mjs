import { expect, test } from "@jest/globals";
import {
  specificationDepthLimit,
  specificationEntryLimit,
} from "../../../../src/checks/general/E-0.1.0.1.4/list-specification-entries.mjs";
import listSpecificationEntries from "../../../../src/checks/general/E-0.1.0.1.4/list-specification-entries.mjs";
function directory(name) {
  return {
    name,
    isDirectory: () => true,
    isFile: () => false,
  };
}
function file(name) {
  return {
    name,
    isDirectory: () => false,
    isFile: () => true,
  };
}
test("lists nested specification entries in stable order", async () => {
  const list = async (path) =>
    path.endsWith("specs") ? [directory("nested"), file("a.yaml")] : [file("b.yaml")];
  await expect(
    listSpecificationEntries("repo", {
      list,
    }),
  ).resolves.toEqual([
    {
      type: "file",
      path: "specs/a.yaml",
    },
    {
      type: "directory",
      path: "specs/nested",
    },
    {
      type: "file",
      path: "specs/nested/b.yaml",
    },
  ]);
});
test("omits artifacts and Git-ignored specification paths", async () => {
  const readPaths = [];
  const list = async (path) => {
    readPaths.push(path);
    const normalizedPath = path.replaceAll("\\", "/");
    if (normalizedPath.endsWith("specs")) return [directory("artifacts"), directory("nested")];
    if (normalizedPath.endsWith("specs/nested")) return [directory("private"), file("kept.yaml")];
    if (normalizedPath.endsWith("specs/nested/private")) return [file("ignored.yaml")];
    return [];
  };
  await expect(
    listSpecificationEntries("repo", {
      list,
      ignoredPaths: new Set(["specs/nested/private"]),
    }),
  ).resolves.toEqual([
    {
      type: "directory",
      path: "specs/nested",
    },
    {
      type: "file",
      path: "specs/nested/kept.yaml",
    },
  ]);
  expect(readPaths).toHaveLength(2);
});
test("uses the default filesystem reader", async () => {
  await expect(listSpecificationEntries(process.cwd())).resolves.toEqual(
    expect.arrayContaining([
      {
        type: "file",
        path: "specs/directives.yaml",
      },
    ]),
  );
});
test("reports unsupported entries", async () => {
  const unsupported = {
    name: "link",
    isDirectory: () => false,
    isFile: () => false,
  };
  await expect(
    listSpecificationEntries("repo", {
      list: async () => [unsupported],
    }),
  ).resolves.toEqual([
    {
      type: "unsupported",
      path: "specs/link",
    },
  ]);
});
test("rejects specification trees above the entry limit", async () => {
  const list = async () =>
    Array.from(
      {
        length: specificationEntryLimit + 1,
      },
      (_, index) => file(`${index}.yaml`),
    );
  await expect(
    listSpecificationEntries("repo", {
      list,
    }),
  ).rejects.toThrow(`specs/ exceeds ${specificationEntryLimit} entries.`);
});
test("rejects specification trees above the directory depth limit", async () => {
  const list = async () => [directory("child")];
  await expect(
    listSpecificationEntries("repo", {
      list,
    }),
  ).rejects.toThrow(`specs/ exceeds ${specificationDepthLimit} directory levels.`);
});

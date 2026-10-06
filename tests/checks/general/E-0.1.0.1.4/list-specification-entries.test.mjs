import { expect, test } from "@jest/globals";
import {
  listSpecificationEntries,
  specificationDepthLimit,
  specificationEntryLimit,
} from "../../../../src/checks/general/E-0.1.0.1.4/list-specification-entries.mjs";

function directory(name) {
  return { name, isDirectory: () => true, isFile: () => false };
}

function file(name) {
  return { name, isDirectory: () => false, isFile: () => true };
}

test("lists nested specification entries in stable order", async () => {
  const list = async (path) =>
    path.endsWith("specs") ? [directory("nested"), file("a.yaml")] : [file("b.yaml")];
  await expect(listSpecificationEntries("repo", { list })).resolves.toEqual([
    { type: "file", path: "specs/a.yaml" },
    { type: "directory", path: "specs/nested" },
    { type: "file", path: "specs/nested/b.yaml" },
  ]);
});

test("uses the default filesystem reader", async () => {
  await expect(listSpecificationEntries(process.cwd())).resolves.toEqual(
    expect.arrayContaining([{ type: "file", path: "specs/directives.yaml" }]),
  );
});

test("reports unsupported entries", async () => {
  const unsupported = { name: "link", isDirectory: () => false, isFile: () => false };
  await expect(
    listSpecificationEntries("repo", { list: async () => [unsupported] }),
  ).resolves.toEqual([{ type: "unsupported", path: "specs/link" }]);
});

test("rejects specification trees above the entry limit", async () => {
  const list = async () =>
    Array.from({ length: specificationEntryLimit + 1 }, (_, index) => file(`${index}.yaml`));
  await expect(listSpecificationEntries("repo", { list })).rejects.toThrow(
    `specs/ exceeds ${specificationEntryLimit} entries.`,
  );
});

test("rejects specification trees above the directory depth limit", async () => {
  const list = async () => [directory("child")];
  await expect(listSpecificationEntries("repo", { list })).rejects.toThrow(
    `specs/ exceeds ${specificationDepthLimit} directory levels.`,
  );
});

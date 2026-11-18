import { expect, jest, test } from "@jest/globals";
import findYamlExampleFiles from "../../../../../src/checks/general/E-0.1.0.1.11/load/example-files.mjs";

test("finds nested YAML examples and skips other file types", async () => {
  const list = jest.fn(async (directory) =>
    directory === "specs"
      ? [
          { name: "nested", isDirectory: () => true, isFile: () => false },
          { name: "top.yaml", isDirectory: () => false, isFile: () => true },
          { name: "README.md", isDirectory: () => false, isFile: () => true },
        ]
      : [{ name: "child.yml", isDirectory: () => false, isFile: () => true }],
  );
  const files = await findYamlExampleFiles("specs", list);
  expect(files.map((path) => path.replaceAll("\\", "/"))).toEqual([
    "specs/nested/child.yml",
    "specs/top.yaml",
  ]);
});

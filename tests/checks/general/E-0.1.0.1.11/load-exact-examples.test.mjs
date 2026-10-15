import { expect, jest, test } from "@jest/globals";
import { loadExactExamples } from "../../../../src/checks/general/E-0.1.0.1.11/load-exact-examples.mjs";

const root = "test-specs";

test("loads nested YAML examples through injected file access", async () => {
  const list = jest.fn(async (directory) => {
    if (directory === root)
      return [
        { name: "nested", isDirectory: () => true, isFile: () => false },
        { name: "general.yaml", isDirectory: () => false, isFile: () => true },
        { name: "README.md", isDirectory: () => false, isFile: () => true },
      ];
    return [{ name: "ordering.yaml", isDirectory: () => false, isFile: () => true }];
  });
  const read = jest.fn(async (path) =>
    path.endsWith("ordering.yaml")
      ? 'directives: [{ examples: ["A nested exact sentence."] }]'
      : 'note: 14\nexamples: ["Use an exact sentence.", { text: "Object example." }, 13, null]',
  );
  const exact = await loadExactExamples({ list, read, root });
  expect(exact).toEqual(
    new Set(["use an exact sentence", "object example", "a nested exact sentence"]),
  );
  expect(list).toHaveBeenCalledTimes(2);
  expect(read).toHaveBeenCalledTimes(2);
});

test("uses injected defaults and skips unreadable or malformed convention files", async () => {
  const list = jest.fn(async () => [
    { name: "unreadable.yaml", isDirectory: () => false, isFile: () => true },
    { name: "malformed.yaml", isDirectory: () => false, isFile: () => true },
  ]);
  const read = jest.fn(async (path) => {
    if (path.endsWith("unreadable.yaml")) throw new Error("read failed");
    return "examples: [";
  });
  await expect(loadExactExamples(undefined, { list, read, root })).resolves.toEqual(new Set());
});

import { beforeEach, expect, jest, test } from "@jest/globals";

const readdir = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readdir }));

const { discoverCheckTree } =
  await import("../../../../src/validation/check-discovery/discover/check-tree.mjs");

const file = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const directory = (name) => ({ name, isDirectory: () => true, isFile: () => false });
const loadModule = async (url) => {
  const ruleId = url.pathname.split("/").at(-1).slice(0, -4);
  return { ruleId, run() {} };
};

beforeEach(() => readdir.mockReset());

test("discovers nested directive modules and records their parent", async () => {
  const readDirectory = jest.fn(async (path) =>
    path.endsWith("E-0.1") ? [file("A-0.1.1.mjs")] : [directory("E-0.1"), file("E-2.mjs")],
  );

  const checks = await discoverCheckTree("C:/checks", loadModule, null, readDirectory);
  expect(checks.map(({ ruleId, parentRuleId }) => ({ ruleId, parentRuleId }))).toEqual([
    { ruleId: "A-0.1.1", parentRuleId: "E-0.1" },
    { ruleId: "E-2", parentRuleId: null },
  ]);
});

test("discovers a root-level module with default parent handling", async () => {
  const checks = await discoverCheckTree("C:/checks", loadModule, null, async () => [
    file("E-3.mjs"),
  ]);
  expect(checks[0]).toMatchObject({ ruleId: "E-3", parentRuleId: null });
});

test("uses the default directory reader and parent rule", async () => {
  readdir.mockResolvedValue([file("E-3.mjs")]);

  await expect(discoverCheckTree("C:/checks", loadModule)).resolves.toMatchObject([
    { ruleId: "E-3", parentRuleId: null },
  ]);
  expect(readdir).toHaveBeenCalledWith("C:/checks", { withFileTypes: true });
});

test("discovers advisory-only metadata without a placeholder runner", async () => {
  const checks = await discoverCheckTree(
    "C:/checks",
    async () => ({ ruleId: "E-3", applicability: "advisory-only" }),
    null,
    async () => [file("E-3.mjs")],
  );
  expect(checks[0]).toMatchObject({ ruleId: "E-3", applicability: "advisory-only" });
  expect(checks[0].run).toBeUndefined();
});

test("ignores unrelated entries and rejects invalid modules", async () => {
  const readDirectory = async () => [file("README.md"), file("E-2.mjs")];
  await expect(
    discoverCheckTree(
      "C:/checks",
      async () => ({ ruleId: "wrong", run() {} }),
      null,
      readDirectory,
    ),
  ).rejects.toThrow("Invalid check module");
});

test("handles explicit directory and non-rule entry shapes", async () => {
  let depth = 0;
  const checks = await discoverCheckTree(
    "C:/root",
    async (url) => ({ ruleId: url.href.includes("E-2") ? "E-2" : "E-0.1", run() {} }),
    null,
    async () => {
      depth += 1;
      if (depth === 1)
        return [directory("E-0.1"), { name: "misc", isDirectory: () => true, isFile: () => false }];
      return [file("README.md"), file(`${depth === 2 ? "E-0.1" : "E-2"}.mjs`)];
    },
  );
  expect(checks).toHaveLength(2);
  expect(checks.find(({ ruleId }) => ruleId === "E-2").parentRuleId).toBeNull();
});

test("limits check discovery depth and entry count", async () => {
  const nested = directory("nested");
  await expect(
    discoverCheckTree(
      "root",
      async () => ({}),
      null,
      async () => [nested],
    ),
  ).rejects.toThrow("128-level depth limit");
  const unrelatedEntries = Array.from({ length: 10_001 }, (_, index) => file(`readme-${index}.md`));
  await expect(
    discoverCheckTree(
      "root",
      async () => ({}),
      null,
      async () => unrelatedEntries,
    ),
  ).rejects.toThrow("10000-entry limit");
});

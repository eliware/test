import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readSourceTestMirrorInventory = jest.fn();
const readSourceTestContents = jest.fn();
const findMirrorViolations = jest.fn();
const findDuplicatePathViolations = jest.fn();
const findOrphanTestViolations = jest.fn();
const findTestContractViolations = jest.fn();
const findMisplacedArtifacts = jest.fn();
const findGeneratedSource = jest.fn();
const validateFocusedSourceTestPair = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/read-source-test-mirror-inventory.mjs",
  () => ({ readSourceTestMirrorInventory }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/read-source-test-test-contents.mjs",
  () => ({ readSourceTestContents }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/find-source-test-mirror-violations.mjs",
  () => ({ findMirrorViolations }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/find-duplicate-test-path-violations.mjs",
  () => ({ findDuplicatePathViolations }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/find-orphan-test-violations.mjs",
  () => ({ findOrphanTestViolations }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/find-test-contract-violations.mjs",
  () => ({ findTestContractViolations }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-test-artifacts.mjs",
  () => ({ findMisplacedArtifacts }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-generated-source.mjs",
  () => ({ findGeneratedSource }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-focused-source-test-pair.mjs",
  () => ({ validateFocusedSourceTestPair }),
);

const { runSourceTestMirroring } =
  await import("../../../../src/checks/general/E-0.1/validate-source-test-mirroring.mjs");
const run = (options) => runSourceTestMirroring({ ruleId: "E-0.1.130.4", ...options });
const inventory = {
  sourceFiles: ["module.mjs"],
  testFiles: ["module.test.mjs"],
  sourceDirectories: [],
  testDirectories: [],
};
const contents = new Map([
  ["module.test.mjs", 'import "../src/module.mjs"; test("ok", () => {});'],
]);

beforeEach(() => {
  jest.resetAllMocks();
  readSourceTestMirrorInventory.mockResolvedValue(inventory);
  readSourceTestContents.mockResolvedValue(contents);
  findMirrorViolations.mockReturnValue([]);
  findDuplicatePathViolations.mockReturnValue([]);
  findOrphanTestViolations.mockReturnValue([]);
  findTestContractViolations.mockReturnValue([]);
  findMisplacedArtifacts.mockReturnValue([]);
  findGeneratedSource.mockResolvedValue([]);
  validateFocusedSourceTestPair.mockResolvedValue([]);
});

test("coordinates full-tree validators and aggregates their findings", async () => {
  const repositoryInventory = { readText: jest.fn() };
  findMirrorViolations.mockReturnValueOnce(["mirror mismatch"]);
  findDuplicatePathViolations.mockReturnValueOnce(["duplicate path"]);
  findOrphanTestViolations.mockReturnValueOnce(["orphan.test.mjs"]);
  findTestContractViolations.mockReturnValueOnce(["test contract invalid"]);
  findMisplacedArtifacts.mockReturnValueOnce(["helper.mjs"]);
  findGeneratedSource.mockResolvedValueOnce(["bundle.mjs"]);

  const result = await run({ root: "/repo", repositoryInventory });
  expect(result).toMatchObject({ ruleId: "E-0.1.130.4", status: "fail" });
  for (const finding of [
    "mirror mismatch",
    "duplicate path",
    "orphan test",
    "test contract invalid",
    "checked-in test fixtures and support",
    "generated or bundled source",
  ])
    expect(result.message).toContain(finding);
  expect(readSourceTestMirrorInventory).toHaveBeenCalledWith("/repo", repositoryInventory);
  expect(readSourceTestContents).toHaveBeenCalledWith(
    "/repo",
    inventory.testFiles,
    repositoryInventory,
  );
  expect(findMirrorViolations).toHaveBeenCalledWith(
    inventory.sourceFiles,
    inventory.testFiles,
    [],
    [],
  );
  expect(findTestContractViolations).toHaveBeenCalledWith(inventory.sourceFiles, contents);
  expect(findGeneratedSource).toHaveBeenCalledWith("/repo", ["module.mjs"], expect.any(Function));
});

test("passes when full-tree validators find no issues and reuses inventory reads", async () => {
  const readText = jest.fn().mockResolvedValue("source");
  const repositoryInventory = { readText };
  findGeneratedSource.mockImplementationOnce(async (_root, _sourceFiles, readSource) => {
    expect(await readSource("module.mjs")).toBe("source");
    return [];
  });

  await expect(run({ root: "/repo", repositoryInventory })).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "pass",
    message: "",
  });
  expect(readText).toHaveBeenCalledWith(join("/repo", "src", "module.mjs"));
});

test("supports full-tree discovery without a repository inventory", async () => {
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "pass",
    message: "",
  });
  expect(findGeneratedSource).toHaveBeenCalledWith("/repo", ["module.mjs"], undefined);
});

test("maps full-tree discovery failures and dispatches focused validation", async () => {
  readSourceTestMirrorInventory.mockRejectedValueOnce(new Error("src directory missing"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "fail",
    message: "src/ is required for source/test mirroring.",
  });

  readSourceTestMirrorInventory.mockClear();
  const focusedScope = { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" };
  await expect(run({ root: "/repo", focusedScope })).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "pass",
    message: "",
  });
  expect(validateFocusedSourceTestPair).toHaveBeenCalledWith("/repo", focusedScope, undefined);
  expect(readSourceTestMirrorInventory).not.toHaveBeenCalled();
});

test("reports focused-pair violations from the focused validator", async () => {
  validateFocusedSourceTestPair.mockResolvedValueOnce(["focused pair invalid"]);
  await expect(
    run({
      root: "/repo",
      focusedScope: { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" },
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "fail",
    message: "Source/test structure is not mirrored; focused pair invalid.",
  });
});

test("passes focused inventory reads to the focused-pair validator", async () => {
  const readText = jest.fn().mockResolvedValue("source");
  validateFocusedSourceTestPair.mockImplementationOnce(async (_root, _scope, readSource) => {
    expect(await readSource("src/module.mjs")).toBe("source");
    return [];
  });

  await expect(
    run({
      root: "/repo",
      focusedScope: { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" },
      repositoryInventory: { readText },
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.130.4", status: "pass", message: "" });
  expect(readText).toHaveBeenCalledWith("src/module.mjs");
});

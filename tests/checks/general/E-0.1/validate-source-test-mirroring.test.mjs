import { beforeEach, expect, jest, test } from "@jest/globals";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

const collectRepositoryFiles = jest.fn();
const collectRepositoryDirectories = jest.fn();
const findMirrorViolations = jest.fn();
const findDuplicatePathViolations = jest.fn();
const findOrphanTestViolations = jest.fn();
const findTestContractViolations = jest.fn();
const findMisplacedArtifacts = jest.fn();
const findGeneratedSource = jest.fn();
const validateFocusedSourceTestPair = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/collect-repository-files.mjs", () => ({ collectRepositoryFiles }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/collect-repository-directories.mjs", () => ({ collectRepositoryDirectories }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-source-test-mirror-violations.mjs", () => ({ findMirrorViolations }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-duplicate-test-path-violations.mjs", () => ({ findDuplicatePathViolations }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-orphan-test-violations.mjs", () => ({ findOrphanTestViolations }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-test-contract-violations.mjs", () => ({ findTestContractViolations }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/validate-test-artifacts.mjs", () => ({ findMisplacedArtifacts }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/validate-generated-source.mjs", () => ({ findGeneratedSource }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/validate-focused-source-test-pair.mjs", () => ({ validateFocusedSourceTestPair }));

const { runSourceTestMirroring } = await import("../../../../src/checks/general/E-0.1/validate-source-test-mirroring.mjs");
const run = (options) => runSourceTestMirroring({ ruleId: "E-0.1.130.4", ...options });

beforeEach(() => {
  jest.resetAllMocks();
  collectRepositoryFiles.mockImplementation(async (directory) => directory.endsWith("src") ? ["module.mjs"] : ["module.test.mjs"]);
  collectRepositoryDirectories.mockResolvedValue([]);
  findMirrorViolations.mockReturnValue([]);
  findDuplicatePathViolations.mockReturnValue([]);
  findOrphanTestViolations.mockReturnValue([]);
  findTestContractViolations.mockReturnValue([]);
  findMisplacedArtifacts.mockReturnValue([]);
  findGeneratedSource.mockResolvedValue([]);
  validateFocusedSourceTestPair.mockResolvedValue([]);
});

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-test-check-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await mkdir(join(root, "src", "nested"), { recursive: true });
  await mkdir(join(root, "tests", "nested"), { recursive: true });
  await writeFile(join(root, "src", "module.mjs"), "export const value = 1;\n");
  await writeFile(join(root, "tests", "module.test.mjs"), 'import "../../src/module.mjs"; test("ok", () => {});');
  return root;
}

test("collects the repository surfaces and composes structural validators", async () => {
  const root = await createRoot();
  try {
    await expect(run({ root })).resolves.toEqual({ ruleId: "E-0.1.130.4", status: "pass", message: "" });
    expect(collectRepositoryFiles).toHaveBeenCalledWith(join(root, "src"), join(root, "src"));
    expect(collectRepositoryFiles).toHaveBeenCalledWith(join(root, "tests"), join(root, "tests"));
    expect(findMirrorViolations).toHaveBeenCalledWith(["module.mjs"], ["module.test.mjs"], [], []);
    expect(findTestContractViolations).toHaveBeenCalledWith(
      ["module.mjs"],
      new Map([["module.test.mjs", 'import "../../src/module.mjs"; test("ok", () => {});']]),
    );
    expect(findGeneratedSource).toHaveBeenCalledWith(root, ["module.mjs"], undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps and aggregates findings from the delegated validators", async () => {
  const root = await createRoot();
  try {
  findMirrorViolations.mockReturnValueOnce(["mirror mismatch"]);
  findDuplicatePathViolations.mockReturnValueOnce(["duplicate path"]);
  findOrphanTestViolations.mockReturnValueOnce(["orphan.test.mjs"]);
  findTestContractViolations.mockReturnValueOnce(["test contract invalid"]);
  findMisplacedArtifacts.mockReturnValueOnce(["helper.mjs"]);
  findGeneratedSource.mockResolvedValueOnce(["bundle.mjs"]);
  const result = await run({ root });
  expect(result).toMatchObject({
    ruleId: "E-0.1.130.4",
    status: "fail",
    message: expect.stringContaining("mirror mismatch"),
  });
  for (const finding of ["duplicate path", "orphan test", "test contract invalid", "test artifacts", "generated or bundled source"]) {
    expect(result.message).toContain(finding);
  }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes missing source/test roots and delegates focused validation", async () => {
  collectRepositoryFiles.mockRejectedValueOnce(new Error("missing"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    ruleId: "E-0.1.130.4",
    status: "fail",
    message: "src/ is required for source/test mirroring.",
  });
  const focusedScope = { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" };
  validateFocusedSourceTestPair.mockResolvedValueOnce(["focused pair invalid"]);
  await expect(run({ root: "/repo", focusedScope })).resolves.toEqual({
    ruleId: "E-0.1.130.4",
    status: "fail",
    message: "Source/test structure is not mirrored; focused pair invalid.",
  });
  expect(validateFocusedSourceTestPair).toHaveBeenCalledWith("/repo", focusedScope, undefined);
  expect(collectRepositoryFiles).toHaveBeenCalledTimes(1);
});

test("uses the run inventory for complete source and test traversal and shared reads", async () => {
  const root = await createRoot();
  try {
    const directories = [];
    const inventory = createRepositoryInventory(root, {
      expandedDirectories: ["src", "tests"],
      includeTestResultsUnder: ["src", "tests"],
      readDirectory: async (directory, options) => {
        directories.push(directory);
        return readdir(directory, options);
      },
    });
    findGeneratedSource.mockImplementationOnce(async (_root, _files, readText) => {
      expect(await readText("module.mjs")).toBe("export const value = 1;\n");
      return [];
    });
    await expect(run({ root, repositoryInventory: inventory })).resolves.toMatchObject({ status: "pass" });
    expect(findMirrorViolations).toHaveBeenCalledWith(
      ["module.mjs"], ["module.test.mjs"], ["nested"], ["nested"],
    );
    expect(findTestContractViolations).toHaveBeenCalledWith(
      ["module.mjs"],
      new Map([[
        "module.test.mjs",
        'import "../../src/module.mjs"; test("ok", () => {});',
      ]]),
    );
    expect(directories).toContain(join(root, "src"));
    expect(directories).toContain(join(root, "tests"));
    expect(directories).not.toContain(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports missing source/test roots from inventory discovery", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-test-missing-"));
  try {
    await mkdir(join(root, "tests"));
    const repositoryInventory = createRepositoryInventory(root, {
      expandedDirectories: ["src", "tests"],
      includeTestResultsUnder: ["src", "tests"],
    });
    await expect(run({ root, repositoryInventory })).resolves.toEqual({
      ruleId: "E-0.1.130.4",
      status: "fail",
      message: "src/ is required for source/test mirroring.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("focused inventory reads only the selected source/test pair", async () => {
  const root = await createRoot();
  try {
    const repositoryInventory = createRepositoryInventory(root, {
      focusedScope: { paths: ["src/module.mjs", "tests/module.test.mjs"] },
    });
    validateFocusedSourceTestPair.mockImplementationOnce(async (_root, _scope, readText) => {
      expect(await readText(join(root, "src", "module.mjs"))).toBe("export const value = 1;\n");
      return [];
    });
    await expect(run({
      root,
      focusedScope: { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" },
      repositoryInventory,
    })).resolves.toMatchObject({ status: "pass" });
    expect(validateFocusedSourceTestPair).toHaveBeenCalledWith(
      root,
      { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" },
      expect.any(Function),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("passes focused validation when the selected source/test pair is clean", async () => {
  await expect(run({
    root: "/repo",
    focusedScope: { sourcePath: "src/module.mjs", testPath: "tests/module.test.mjs" },
  })).resolves.toEqual({ ruleId: "E-0.1.130.4", status: "pass", message: "" });
});


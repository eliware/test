import { beforeEach, expect, jest, test } from "@jest/globals";

const findDirectToolUses = jest.fn();
const findDirectValidationDependencies = jest.fn();
const findInvalidValidationScripts = jest.fn();
const findRepositoryFiles = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.3/find-direct-tool-uses.mjs",
  () => ({ findDirectToolUses }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.3/validate-validation-dependencies.mjs",
  () => ({ findDirectValidationDependencies }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.3/validate-validation-scripts.mjs",
  () => ({ findInvalidValidationScripts }),
);
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-repository-files.mjs", () => ({
  findRepositoryFiles,
}));

const { run } = await import("../../../../src/checks/general/E-0.1/E-0.1.3.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  findDirectToolUses.mockResolvedValue([]);
  findDirectValidationDependencies.mockReturnValue([]);
  findInvalidValidationScripts.mockReturnValue([]);
  findRepositoryFiles.mockResolvedValue(["README.md"]);
});

test("composes script, dependency, and repository-source checks", async () => {
  const packageJson = { scripts: { test: "eliware-test" } };
  await expect(run({ root: "/repo", packageJson })).resolves.toEqual({
    ruleId: "E-0.1.3",
    status: "pass",
    message: "",
  });
  expect(findInvalidValidationScripts).toHaveBeenCalledWith(packageJson.scripts);
  expect(findDirectValidationDependencies).toHaveBeenCalledWith(packageJson);
  expect(findRepositoryFiles).toHaveBeenCalledWith("/repo");
  expect(findDirectToolUses).toHaveBeenCalledWith("/repo", ["README.md"]);
});

test("reuses the run inventory for discovery and file reads", async () => {
  const repositoryInventory = {
    repositoryFiles: jest.fn(async () => ["README.md"]),
    readText: jest.fn(async () => "content"),
  };
  findDirectToolUses.mockImplementationOnce(async (_root, _files, readText) => {
    await readText("README.md");
    return [];
  });

  await expect(run({ root: "/repo", packageJson: {}, repositoryInventory })).resolves.toMatchObject(
    {
      status: "pass",
    },
  );
  expect(repositoryInventory.repositoryFiles).toHaveBeenCalledTimes(1);
  expect(repositoryInventory.readText).toHaveBeenCalledWith("README.md");
});

test.each([
  [
    findInvalidValidationScripts,
    ["test"],
    "Validation scripts must use eliware-test rather than direct tools: test.",
  ],
  [
    findDirectValidationDependencies,
    ["jest"],
    "Repositories must not directly declare shared validation tools: jest.",
  ],
])(
  "short-circuits with the diagnostic from a failed validation phase",
  async (validator, findings, message) => {
    validator.mockReturnValueOnce(findings);
    await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
      ruleId: "E-0.1.3",
      status: "fail",
      message,
    });
    expect(findDirectToolUses).not.toHaveBeenCalled();
  },
);

test("maps repository inspection findings and errors", async () => {
  findDirectToolUses.mockResolvedValueOnce(["validate.mjs"]);
  await expect(run({ root: "/repo", packageJson: {}, files: ["validate.mjs"] })).resolves.toEqual({
    ruleId: "E-0.1.3",
    status: "fail",
    message: "Direct validation-tool use found in repository files: validate.mjs.",
  });
  findDirectToolUses.mockRejectedValueOnce(new Error("read failed"));
  await expect(run({ root: "/repo", packageJson: {}, files: [] })).resolves.toMatchObject({
    status: "fail",
    message: "Repository validation surfaces could not be inspected: read failed",
  });
});

test("does not inspect repository files when no root is supplied", async () => {
  await expect(run({ packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.3",
    status: "pass",
    message: "",
  });
  expect(findRepositoryFiles).not.toHaveBeenCalled();
  expect(findDirectToolUses).not.toHaveBeenCalled();
});

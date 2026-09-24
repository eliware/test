import { beforeEach, expect, jest, test } from "@jest/globals";

const inspectLibraryExamples = jest.fn();
const executeLibraryExamples = jest.fn();
const validateLibraryPackageAllowlist = jest.fn();
jest.unstable_mockModule("../../../../src/checks/library/E-1.40/inspect-library-examples.mjs", () => ({ inspectLibraryExamples }));
jest.unstable_mockModule("../../../../src/checks/library/E-1.40/execute-library-examples.mjs", () => ({ executeLibraryExamples }));
jest.unstable_mockModule("../../../../src/checks/library/E-1.40/validate-library-package-allowlist.mjs", () => ({ validateLibraryPackageAllowlist }));

const { run } = await import("../../../../src/checks/library/E-1.40/A-1.40.1.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  inspectLibraryExamples.mockResolvedValue({ examples: ["examples/basic.mjs"] });
  executeLibraryExamples.mockResolvedValue(null);
  validateLibraryPackageAllowlist.mockReturnValue(null);
});

test("inspects, executes, and validates package contents in order", async () => {
  const root = "/repo";
  const packageJson = { files: ["src/"] };
  const executeExample = jest.fn();
  await expect(run({ root, packageJson, executeExample })).resolves.toEqual({
    ruleId: "A-1.40.1",
    status: "pass",
    message: "",
  });
  expect(inspectLibraryExamples).toHaveBeenCalledWith(root);
  expect(executeLibraryExamples).toHaveBeenCalledWith(root, ["examples/basic.mjs"], executeExample);
  expect(validateLibraryPackageAllowlist).toHaveBeenCalledWith(packageJson);
  expect(inspectLibraryExamples.mock.invocationCallOrder[0]).toBeLessThan(executeLibraryExamples.mock.invocationCallOrder[0]);
  expect(executeLibraryExamples.mock.invocationCallOrder[0]).toBeLessThan(validateLibraryPackageAllowlist.mock.invocationCallOrder[0]);
});

test.each([
  [inspectLibraryExamples, { error: "documentation index missing" }, "documentation index missing"],
  [executeLibraryExamples, null, "Example execution failed"],
])("stops on an inspection or execution failure", async (phase, result, expectedMessage) => {
  phase.mockResolvedValueOnce(result ?? expectedMessage);
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toMatchObject({
    ruleId: "A-1.40.1",
    status: "fail",
    message: expectedMessage,
  });
  if (phase === inspectLibraryExamples) expect(executeLibraryExamples).not.toHaveBeenCalled();
  expect(validateLibraryPackageAllowlist).not.toHaveBeenCalled();
});

test("maps package allowlist findings and unexpected inspection errors", async () => {
  validateLibraryPackageAllowlist.mockReturnValueOnce("package allowlist missing");
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-1.40.1",
    status: "fail",
    message: "package allowlist missing",
  });
  inspectLibraryExamples.mockRejectedValueOnce(new Error("read failed"));
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-1.40.1",
    status: "fail",
    message: "Libraries must provide complete docs/ and examples/ indexes.",
  });
});

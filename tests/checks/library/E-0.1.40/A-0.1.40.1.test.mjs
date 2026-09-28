import { beforeEach, expect, jest, test } from "@jest/globals";

const inspectLibraryExamples = jest.fn();
const executeLibraryExamples = jest.fn();
const validateLibraryPackageAllowlist = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/library/E-0.1.40/inspect-library-examples.mjs",
  () => ({ inspectLibraryExamples }),
);
jest.unstable_mockModule(
  "../../../../src/checks/library/E-0.1.40/execute-library-examples.mjs",
  () => ({ executeLibraryExamples }),
);
jest.unstable_mockModule(
  "../../../../src/checks/library/E-0.1.40/validate-library-package-allowlist.mjs",
  () => ({ validateLibraryPackageAllowlist }),
);

const { run } = await import("../../../../src/checks/library/E-0.1.40/A-0.1.40.1.mjs");

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
  const context = { root, packageJson, executeExample };
  await expect(run(context)).resolves.toEqual({
    ruleId: "A-0.1.40.1",
    status: "pass",
    message: "",
  });
  expect(inspectLibraryExamples).toHaveBeenCalledWith(root, context);
  expect(executeLibraryExamples).toHaveBeenCalledWith(root, ["examples/basic.mjs"], executeExample);
  expect(validateLibraryPackageAllowlist).toHaveBeenCalledWith(packageJson);
  expect(inspectLibraryExamples.mock.invocationCallOrder[0]).toBeLessThan(
    executeLibraryExamples.mock.invocationCallOrder[0],
  );
  expect(executeLibraryExamples.mock.invocationCallOrder[0]).toBeLessThan(
    validateLibraryPackageAllowlist.mock.invocationCallOrder[0],
  );
});

test("skips only example execution when inspection cannot provide an example list", async () => {
  inspectLibraryExamples.mockResolvedValueOnce({ error: "documentation index missing" });
  validateLibraryPackageAllowlist.mockReturnValueOnce("package allowlist missing");

  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-0.1.40.1",
    status: "fail",
    message: "documentation index missing\npackage allowlist missing",
  });
  expect(executeLibraryExamples).not.toHaveBeenCalled();
  expect(validateLibraryPackageAllowlist).toHaveBeenCalled();
});

test("continues package validation after example execution fails", async () => {
  executeLibraryExamples.mockResolvedValueOnce("Example execution failed");
  validateLibraryPackageAllowlist.mockReturnValueOnce("package allowlist missing");
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-0.1.40.1",
    status: "fail",
    message: "Example execution failed\npackage allowlist missing",
  });

  executeLibraryExamples.mockRejectedValueOnce(new Error("spawn denied"));
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Library examples could not be executed: spawn denied"),
  });
  expect(validateLibraryPackageAllowlist).toHaveBeenCalled();
});

test("maps package allowlist findings and unexpected inspection errors", async () => {
  validateLibraryPackageAllowlist.mockReturnValueOnce("package allowlist missing");
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-0.1.40.1",
    status: "fail",
    message: "package allowlist missing",
  });
  inspectLibraryExamples.mockRejectedValueOnce(new Error("read failed"));
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "A-0.1.40.1",
    status: "fail",
    message: "Libraries must provide complete docs/ and examples/ indexes: read failed",
  });
  expect(validateLibraryPackageAllowlist).toHaveBeenCalled();
});

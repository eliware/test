import { beforeEach, expect, jest, test } from "@jest/globals";

const validateRequiredScripts = jest.fn();
const resolveFormatterScriptPolicy = jest.fn();
const executeFormatterValidation = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-required-scripts.mjs",
  () => ({ validateRequiredScripts }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-formatter-script-policy.mjs",
  () => ({ resolveFormatterScriptPolicy }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/execute-formatter-validation.mjs",
  () => ({ executeFormatterValidation }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.17.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  resolveFormatterScriptPolicy.mockReturnValue({ requiresPack: false });
  validateRequiredScripts.mockReturnValue(null);
  executeFormatterValidation.mockResolvedValue(null);
});

test("coordinates script policy and formatter validation", async () => {
  const packageJson = { scripts: { test: "eliware-test" } };
  const context = { packageJson, root: "/repo", mode: "format-check" };

  await expect(run(context)).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "pass",
    message: "",
  });
  expect(resolveFormatterScriptPolicy).toHaveBeenCalledWith(packageJson);
  expect(validateRequiredScripts).toHaveBeenCalledWith(packageJson.scripts, {
    requiresPack: false,
  });
  expect(executeFormatterValidation).toHaveBeenCalledWith(
    expect.objectContaining({ root: "/repo", mode: "format-check" }),
  );
});

test("passes the aggregate null mode when no formatter mode was requested", async () => {
  await expect(run({ packageJson: {}, executeFormat: true })).resolves.toMatchObject({
    status: "pass",
  });
  expect(executeFormatterValidation).toHaveBeenCalledWith(
    expect.objectContaining({ mode: null, executeFormat: true }),
  );
});

test("reports script and formatter failures together", async () => {
  validateRequiredScripts.mockReturnValueOnce("required script missing");
  executeFormatterValidation.mockResolvedValueOnce("Prettier failed");

  await expect(run({ packageJson: {}, mode: "format-check" })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "required script missing\nPrettier failed",
  });
  expect(executeFormatterValidation).toHaveBeenCalled();
});

test("maps unexpected formatter errors and accepts write-format mode", async () => {
  executeFormatterValidation.mockRejectedValueOnce(new Error("unexpected formatter failure"));
  await expect(run({ packageJson: {}, mode: "format" })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Prettier validation failed: unexpected formatter failure",
  });
  expect(executeFormatterValidation).toHaveBeenCalledWith(
    expect.objectContaining({ mode: "format" }),
  );
});

test("reports unsupported mode and still validates required scripts", async () => {
  validateRequiredScripts.mockReturnValueOnce("required script missing");

  await expect(run({ packageJson: {}, mode: "unknown" })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Unsupported formatter mode: unknown.\nrequired script missing",
  });
  expect(validateRequiredScripts).toHaveBeenCalled();
  expect(executeFormatterValidation).not.toHaveBeenCalled();
});

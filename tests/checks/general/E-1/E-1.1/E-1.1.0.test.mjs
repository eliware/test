import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const readReadmeSections = jest.fn();
const expectedReadmeHeadings = jest.fn();
const validateReadmeBranding = jest.fn();
const validateReadmeMetadata = jest.fn();
const validateReadmeRequiredContent = jest.fn();
const inspectReadmeDocumentationIndexes = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.1/read-readme-sections.mjs", () => ({ readReadmeSections, expectedReadmeHeadings }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.1/validate-readme-branding.mjs", () => ({ validateReadmeBranding }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.1/validate-readme-metadata.mjs", () => ({ validateReadmeMetadata }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.1/validate-readme-required-content.mjs", () => ({ validateReadmeRequiredContent }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.1/inspect-readme-documentation-indexes.mjs", () => ({ inspectReadmeDocumentationIndexes }));

const { run } = await import("../../../../../src/checks/general/E-1/E-1.1/E-1.1.0.mjs");
const headings = ["Table of Contents", "Features", "Requirements"];

beforeEach(() => {
  jest.resetAllMocks();
  readFile.mockResolvedValue("README content");
  readReadmeSections.mockReturnValue(new Map(headings.map((heading) => [heading, "section"])));
  expectedReadmeHeadings.mockReturnValue(headings);
  validateReadmeBranding.mockReturnValue(null);
  validateReadmeMetadata.mockReturnValue(null);
  validateReadmeRequiredContent.mockReturnValue(null);
  inspectReadmeDocumentationIndexes.mockResolvedValue({ examplesRequired: false, error: null });
});

test("composes README structure, branding, content, metadata, and index validation", async () => {
  const packageJson = { name: "@eliware/example" };
  await expect(run({ root: "/repo", packageJson })).resolves.toEqual({ ruleId: "E-1.1.0", status: "pass", message: "" });
  expect(readFile).toHaveBeenCalledWith(expect.stringMatching(/README\.md$/u), "utf8");
  expect(readReadmeSections).toHaveBeenCalledWith("README content", packageJson);
  expect(validateReadmeBranding).toHaveBeenCalledWith("README content");
  expect(inspectReadmeDocumentationIndexes).toHaveBeenCalledWith("/repo");
  expect(validateReadmeRequiredContent).toHaveBeenCalledWith("README content", packageJson, { examplesRequired: false });
  expect(validateReadmeMetadata).toHaveBeenCalledWith("README content", packageJson);
  expect(readFile.mock.invocationCallOrder[0]).toBeLessThan(readReadmeSections.mock.invocationCallOrder[0]);
  expect(validateReadmeBranding.mock.invocationCallOrder[0]).toBeLessThan(inspectReadmeDocumentationIndexes.mock.invocationCallOrder[0]);
  expect(validateReadmeRequiredContent.mock.invocationCallOrder[0]).toBeLessThan(validateReadmeMetadata.mock.invocationCallOrder[0]);
});

test("fails for missing README or structural headings before delegated checks", async () => {
  readFile.mockRejectedValueOnce(new Error("missing"));
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-1.1.0", status: "fail", message: "README.md is required." });
  expect(readReadmeSections).not.toHaveBeenCalled();

  readReadmeSections.mockReturnValueOnce(new Map());
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-1.1.0",
    status: "fail",
    message: "README.md is missing required sections: Features, Requirements.",
  });
  expect(validateReadmeBranding).not.toHaveBeenCalled();
});

test.each([
  [validateReadmeBranding, "branding invalid"],
  [validateReadmeRequiredContent, "required content invalid"],
  [validateReadmeMetadata, "metadata invalid"],
])("returns the first delegated validation failure", async (validator, message) => {
  validator.mockReturnValueOnce(message);
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-1.1.0", status: "fail", message });
  if (validator === validateReadmeBranding) expect(inspectReadmeDocumentationIndexes).not.toHaveBeenCalled();
  if (validator !== validateReadmeMetadata) expect(validateReadmeMetadata).not.toHaveBeenCalled();
});

test("reports index validation errors after validating README content", async () => {
  inspectReadmeDocumentationIndexes.mockResolvedValueOnce({ examplesRequired: true, error: "examples index missing" });
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-1.1.0",
    status: "fail",
    message: "examples index missing",
  });
  expect(validateReadmeRequiredContent).toHaveBeenCalledWith("README content", undefined, { examplesRequired: true });
});

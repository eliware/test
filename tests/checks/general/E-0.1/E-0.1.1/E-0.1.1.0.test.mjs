import { beforeEach, expect, jest, test } from "@jest/globals";

const loadReadmeValidationInputs = jest.fn();
const findMissingReadmeSections = jest.fn();
const validateReadmeBranding = jest.fn();
const validateReadmeMetadata = jest.fn();
const validateReadmeRequiredContent = jest.fn();
const inspectReadmeDocumentationIndexes = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/load-readme-validation-inputs.mjs",
  () => ({ loadReadmeValidationInputs }),
);
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.1/find-missing-readme-sections.mjs", () => ({ findMissingReadmeSections }));
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-branding.mjs", () => ({ validateReadmeBranding }));
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-metadata.mjs", () => ({ validateReadmeMetadata }));
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-required-content.mjs", () => ({ validateReadmeRequiredContent }));
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.1/inspect-readme-documentation-indexes.mjs", () => ({ inspectReadmeDocumentationIndexes }));

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.1/E-0.1.1.0.mjs");
const sections = new Map([["Features", "section"]]);
const inputs = { readme: "README content", sections };

beforeEach(() => {
  jest.resetAllMocks();
  loadReadmeValidationInputs.mockResolvedValue(inputs);
  findMissingReadmeSections.mockReturnValue([]);
  validateReadmeBranding.mockReturnValue(null);
  validateReadmeMetadata.mockReturnValue(null);
  validateReadmeRequiredContent.mockReturnValue(null);
  inspectReadmeDocumentationIndexes.mockResolvedValue({ examplesRequired: false, error: null });
});

test("coordinates README validation phases using loaded inputs", async () => {
  const packageJson = { name: "@eliware/example" };
  await expect(run({ root: "/repo", packageJson })).resolves.toEqual({ ruleId: "E-0.1.1.0", status: "pass", message: "" });
  expect(loadReadmeValidationInputs).toHaveBeenCalledWith({ root: "/repo", packageJson });
  expect(findMissingReadmeSections).toHaveBeenCalledWith(sections, packageJson);
  expect(validateReadmeRequiredContent).toHaveBeenCalledWith(
    inputs.readme,
    packageJson,
    expect.objectContaining({ examplesRequired: false, sections }),
  );
  const phases = [
    loadReadmeValidationInputs,
    findMissingReadmeSections,
    validateReadmeBranding,
    inspectReadmeDocumentationIndexes,
    validateReadmeRequiredContent,
    validateReadmeMetadata,
  ];
  const phaseOrder = phases.map((phase) => phase.mock.invocationCallOrder[0]);
  expect(phaseOrder).toEqual([...phaseOrder].sort((left, right) => left - right));
});

test("fails for missing README or structural headings before delegated checks", async () => {
  loadReadmeValidationInputs.mockResolvedValueOnce(null);
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-0.1.1.0", status: "fail", message: "README.md is required." });
  expect(findMissingReadmeSections).not.toHaveBeenCalled();

  findMissingReadmeSections.mockReturnValueOnce(["Features", "Requirements"]);
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.1.0",
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
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-0.1.1.0", status: "fail", message });
  if (validator === validateReadmeBranding) expect(inspectReadmeDocumentationIndexes).not.toHaveBeenCalled();
  if (validator !== validateReadmeMetadata) expect(validateReadmeMetadata).not.toHaveBeenCalled();
});

test("reports index validation errors after validating README content", async () => {
  inspectReadmeDocumentationIndexes.mockResolvedValueOnce({ examplesRequired: true, error: "examples index missing" });
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.1.0",
    status: "fail",
    message: "examples index missing",
  });
  expect(validateReadmeRequiredContent).toHaveBeenCalledWith(
    inputs.readme,
    undefined,
    expect.objectContaining({ examplesRequired: true, sections }),
  );
});

import { beforeEach, expect, jest, test } from "@jest/globals";

const validateApplicationDocumentation = jest.fn();
const validateLibraryExamples = jest.fn();
const validateLibraryExamplesLink = jest.fn();
jest.unstable_mockModule(
  "../../../src/checks/application/E-0.1.4.1.0/validate-application-documentation.mjs",
  () => ({ validateApplicationDocumentation }),
);
jest.unstable_mockModule(
  "../../../src/checks/library/E-0.1.3.1.0/validate-library-examples.mjs",
  () => ({ validateLibraryExamples }),
);
jest.unstable_mockModule(
  "../../../src/checks/library/E-0.1.3.1.0/validate-library-examples-link.mjs",
  () => ({ validateLibraryExamplesLink }),
);

const { ruleId, run } = await import("../../../src/checks/library/E-0.1.3.1.0.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validateApplicationDocumentation.mockResolvedValue([]);
  validateLibraryExamples.mockResolvedValue([]);
  validateLibraryExamplesLink.mockResolvedValue([]);
});

test("coordinates documentation indexes and native ESM examples", async () => {
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "General checks enforce README.md and AGENTS.md order.",
  });
  expect(validateApplicationDocumentation).toHaveBeenCalledWith({ root: "/repo" });
  expect(validateLibraryExamples).toHaveBeenCalledWith({ root: "/repo" });
  expect(validateLibraryExamplesLink).toHaveBeenCalledWith({ root: "/repo" });
});

test("reports documentation and example index gaps", async () => {
  validateApplicationDocumentation.mockResolvedValueOnce(["docs/README.md is required."]);
  validateLibraryExamples.mockResolvedValueOnce(["Libraries must provide an example."]);
  validateLibraryExamplesLink.mockResolvedValueOnce(["README.md must link examples/README.md."]);
  await expect(run()).resolves.toEqual({
    ruleId,
    status: "fail",
    message:
      "docs/README.md is required.\nLibraries must provide an example.\nREADME.md must link examples/README.md.",
  });
});

test("uses application documentation checks when application applies", async () => {
  await expect(
    run({ packageJson: { eliware: { apply: ["general", "application", "library"] } } }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(validateApplicationDocumentation).not.toHaveBeenCalled();
});

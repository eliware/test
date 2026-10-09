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
const repositoryInventory = {
  readText: async (path) =>
    path === "AGENTS.md" ? "## Library" : "## API\n## Packaging\n## Examples",
};

beforeEach(() => {
  jest.resetAllMocks();
  validateApplicationDocumentation.mockResolvedValue([]);
  validateLibraryExamples.mockResolvedValue([]);
  validateLibraryExamplesLink.mockResolvedValue([]);
});

test("checks library documentation indexes and native ESM examples", async () => {
  await expect(
    run({
      root: "/repo",
      packageJson: { eliware: { apply: ["general", "library"] } },
      repositoryInventory,
    }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  const context = {
    root: "/repo",
    packageJson: { eliware: { apply: ["general", "library"] } },
    repositoryInventory,
  };
  expect(validateApplicationDocumentation).toHaveBeenCalledWith(context);
  expect(validateLibraryExamples).toHaveBeenCalledWith(context);
  expect(validateLibraryExamplesLink).toHaveBeenCalledWith(context);
});

test("reports documentation and example index gaps", async () => {
  validateApplicationDocumentation.mockResolvedValueOnce(["docs/README.md is required."]);
  validateLibraryExamples.mockResolvedValueOnce(["Libraries must provide an example."]);
  validateLibraryExamplesLink.mockResolvedValueOnce(["README.md must link examples/README.md."]);
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message:
      "docs/README.md is required.\nLibraries must provide an example.\nREADME.md must link examples/README.md.",
  });
});

test("uses the default context when it is omitted", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});

import { beforeEach, expect, jest, test } from "@jest/globals";

const validateLibraryExamples = jest.fn();
const validateLibraryExamplesLink = jest.fn();
jest.unstable_mockModule(
  "../../../src/checks/library/E-0.1.3.1.0/validate-library/examples.mjs",
  () => ({ validateLibraryExamples }),
);
jest.unstable_mockModule(
  "../../../src/checks/library/E-0.1.3.1.0/validate-library/examples-link.mjs",
  () => ({ validateLibraryExamplesLink }),
);

const { ruleId, run } = await import("../../../src/checks/library/E-0.1.3.1.0.mjs");
const repositoryInventory = {
  readText: async (path) =>
    path === "AGENTS.md"
      ? `## Library
Run focused tests first during development.
Run one test file with \`npm test -- tests/path/to/example.test.mjs\`.
Run multiple test files with \`npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs\`.
Prevent repeated full-suite runs during development.
Run the full \`npm test\` suite for final validation before a commit, milestone, or release.`
      : "## API\n## Packaging\n## Examples",
};

beforeEach(() => {
  jest.resetAllMocks();
  validateLibraryExamples.mockResolvedValue([]);
  validateLibraryExamplesLink.mockResolvedValue([]);
});

test("checks library guidance and native ESM examples", async () => {
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
  expect(validateLibraryExamples).toHaveBeenCalledWith(context);
  expect(validateLibraryExamplesLink).toHaveBeenCalledWith(context);
});

test("reports example gaps", async () => {
  validateLibraryExamples.mockResolvedValueOnce(["Libraries must provide an example."]);
  validateLibraryExamplesLink.mockResolvedValueOnce(["README.md must link examples/README.md."]);
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Libraries must provide an example.\nREADME.md must link examples/README.md.",
  });
});

test("uses the default context when it is omitted", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});

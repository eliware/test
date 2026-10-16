import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const access = jest.fn();
const readSpecificationHeadings = jest.fn();
const validateAgentsContent = jest.fn();
const validateAgentsStructure = jest.fn();
const validateAgentsCompositionOrder = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile, access }));
jest.unstable_mockModule(
  "../../../src/checks/shared/E-0.1.0.1.2/read-specification-headings.mjs",
  () => ({
    readSpecificationHeadings,
  }),
);
jest.unstable_mockModule(
  "../../../src/checks/shared/E-0.1.0.1.2/validate-agents/content.mjs",
  () => ({
    validateAgentsContent,
  }),
);
jest.unstable_mockModule(
  "../../../src/checks/shared/E-0.1.0.1.2/validate-agents/structure.mjs",
  () => ({
    validateAgentsStructure,
  }),
);
jest.unstable_mockModule(
  "../../../src/checks/shared/E-0.1.0.1.2/validate-agents/composition-order.mjs",
  () => ({
    validateAgentsCompositionOrder,
  }),
);

const { run, ruleId } = await import("../../../src/checks/shared/E-0.1.0.1.2.mjs");

const agents = "# AGENTS.md\n## Project\n";

beforeEach(() => {
  readFile.mockReset().mockResolvedValue(agents);
  access.mockReset().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  readSpecificationHeadings.mockReset().mockResolvedValue(new Set(["Project"]));
  validateAgentsContent.mockReset().mockReturnValue([]);
  validateAgentsStructure.mockReset().mockReturnValue([]);
  validateAgentsCompositionOrder.mockReset().mockReturnValue([]);
});

test("passes a valid root guide with mocked repository responses", async () => {
  await expect(
    run({ root: "repo", packageJson: { eliware: { apply: ["application"] } } }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(readFile).toHaveBeenCalledWith(expect.stringMatching(/repo[\\/]AGENTS\.md$/), "utf8");
  expect(readSpecificationHeadings).toHaveBeenCalledWith("repo");
});

test("uses the current directory when the context omits its root", async () => {
  await run({ packageJson: {} });
  expect(readSpecificationHeadings).toHaveBeenCalledWith(process.cwd());
});

test("uses default context and dependency values", async () => {
  await run();
  expect(readFile).toHaveBeenCalledWith(expect.stringContaining("AGENTS.md"), "utf8");
});

test("reports a missing AGENTS file", async () => {
  readFile.mockRejectedValueOnce(new Error("missing"));
  await expect(run({ root: "repo" })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "AGENTS.md is required at the repository root.",
  });
  expect(readSpecificationHeadings).not.toHaveBeenCalled();
});

test("combines guide, structure, and composition failures", async () => {
  validateAgentsContent.mockReturnValue(["content issue"]);
  validateAgentsStructure.mockReturnValue(["heading issue"]);
  validateAgentsCompositionOrder.mockReturnValue(["composition issue"]);
  access.mockResolvedValue(undefined);
  const result = await run({ root: "repo", packageJson: {} });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("content issue");
  expect(result.message).toContain("heading issue");
  expect(result.message).toContain("composition issue");
  expect(result.message).toContain("inside .knit");
});

test("reports specification and knit access errors", async () => {
  readSpecificationHeadings.mockRejectedValueOnce(new Error("invalid YAML"));
  access.mockRejectedValueOnce(Object.assign(new Error("blocked"), { code: "EACCES" }));
  const result = await run({ root: "repo" });
  expect(result.message).toContain("Repository specifications could not be read: invalid YAML");
  expect(result.message).toContain(".knit/README.md could not be checked: blocked");
});

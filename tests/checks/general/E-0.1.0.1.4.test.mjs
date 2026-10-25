import { beforeEach, expect, jest, test } from "@jest/globals";

const validateMarkdownLinks = jest.fn();
const validateSpecificationIndexes = jest.fn();
const validateSpecificationDirectives = jest.fn();

jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.4/validate/markdown/links.mjs",
  () => ({ validateMarkdownLinks }),
);
jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.4/validate/specification/indexes.mjs",
  () => ({ validateSpecificationIndexes }),
);
jest.unstable_mockModule(
  "../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives.mjs",
  () => ({ validateSpecificationDirectives }),
);

const { run, ruleId } = await import("../../../src/checks/general/E-0.1.0.1.4.mjs");

beforeEach(() => {
  validateMarkdownLinks.mockReset().mockResolvedValue([]);
  validateSpecificationIndexes.mockReset().mockResolvedValue([]);
  validateSpecificationDirectives.mockReset().mockResolvedValue([]);
});

test("passes when each specification validator returns no findings", async () => {
  const context = { root: "repo", packageJson: { eliware: { id: "E-0" } } };
  const dependencies = { read: jest.fn() };

  await expect(run(context, dependencies)).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(validateMarkdownLinks).toHaveBeenCalledWith("repo", context, dependencies);
  expect(validateSpecificationIndexes).toHaveBeenCalledWith("repo", dependencies);
  expect(validateSpecificationDirectives).toHaveBeenCalledWith(
    "repo",
    context.packageJson,
    dependencies,
  );
});

test("combines validator failures when the context and dependencies use defaults", async () => {
  validateMarkdownLinks.mockResolvedValue(["Markdown issue."]);
  validateSpecificationIndexes.mockResolvedValue(["Index issue."]);
  validateSpecificationDirectives.mockResolvedValue(["Directive issue."]);

  const result = await run(undefined, undefined);

  expect(result).toEqual({
    ruleId,
    status: "fail",
    message: "Markdown issue.\nIndex issue.\nDirective issue.",
  });
  expect(validateMarkdownLinks).toHaveBeenCalledWith(process.cwd(), {}, {});
  expect(validateSpecificationIndexes).toHaveBeenCalledWith(process.cwd(), {});
  expect(validateSpecificationDirectives).toHaveBeenCalledWith(process.cwd(), undefined, {});
});

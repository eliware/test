import { beforeEach, expect, jest, test } from "@jest/globals";

const collectReadmeFiles = jest.fn();
const validateMarkdownLinks = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/collect-readme-files.mjs",
  () => ({ collectReadmeFiles }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/documentation/E-0.1.100/validate-markdown-links.mjs",
  () => ({ validateMarkdownLinks }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.1/A-0.1.1.1.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  collectReadmeFiles.mockResolvedValue(["README.md", "docs/README.md"]);
  validateMarkdownLinks.mockResolvedValue(null);
});

test("validates links in every discovered README", async () => {
  const context = { root: "/repo", repositoryInventory: {} };
  await expect(run(context)).resolves.toEqual({ ruleId: "A-0.1.1.1", status: "pass", message: "" });
  expect(collectReadmeFiles).toHaveBeenCalledWith("/repo", context.repositoryInventory);
  expect(validateMarkdownLinks).toHaveBeenCalledWith(
    "/repo",
    ["README.md", "docs/README.md"],
    context,
  );
});

test("returns link failures and normalizes discovery errors", async () => {
  validateMarkdownLinks.mockResolvedValueOnce("README.md: missing target");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "README.md: missing target",
  });
  collectReadmeFiles.mockRejectedValueOnce(new Error("discovery failed"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "README link validation failed: discovery failed",
  });
});

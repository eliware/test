import { expect, jest, test } from "@jest/globals";
import { validateMarkdownFiles } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown/validate-markdown-files.mjs";

test("validates each Markdown file and aggregates its errors", async () => {
  const read = jest.fn(async (_path) => "[link](target.md)");
  const validateLocal = jest.fn(async () => null);
  const errors = await validateMarkdownFiles(
    "/repo",
    ["README.md", "guide.md"],
    validateLocal,
    read,
  );
  expect(errors).toEqual([]);
  expect(read).toHaveBeenCalledTimes(2);
  expect(validateLocal).toHaveBeenCalledTimes(2);
});

test("aggregates unresolved links across files", async () => {
  const read = jest.fn(async (path) =>
    path.endsWith("README.md") ? "[a](missing.md)" : "[b](missing.md)",
  );
  const validateLocal = jest.fn(async () => "missing link");
  await expect(
    validateMarkdownFiles("/repo", ["README.md", "guide.md"], validateLocal, read),
  ).resolves.toEqual(["missing link", "missing link"]);
  expect(validateLocal).toHaveBeenCalledTimes(2);
});

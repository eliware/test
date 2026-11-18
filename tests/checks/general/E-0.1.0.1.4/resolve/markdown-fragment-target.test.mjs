import { expect, jest, test } from "@jest/globals";
import hasMarkdownFragmentTarget from "../../../../../src/checks/general/E-0.1.0.1.4/resolve/markdown-fragment-target.mjs";
test("reads a Markdown target and validates its fragment", async () => {
  const read = jest.fn(async () => "# Target");
  await expect(hasMarkdownFragmentTarget(read, "target.md", "target")).resolves.toBe(true);
  expect(read).toHaveBeenCalledWith("target.md", "utf8");
});
test("reports fragments that do not appear in the target", async () => {
  await expect(
    hasMarkdownFragmentTarget(async () => "# Other", "target.md", "missing"),
  ).resolves.toBe(false);
});

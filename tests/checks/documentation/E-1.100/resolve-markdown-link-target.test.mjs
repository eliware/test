import { expect, test } from "@jest/globals";
import { resolveMarkdownLinkTarget } from "../../../../src/checks/documentation/E-1.100/resolve-markdown-link-target.mjs";

test("resolves local links and ignores external or escaping targets", () => {
  expect(resolveMarkdownLinkTarget("C:/repo", "README.md", "docs/index.md#top")).toBe("C:\\repo\\docs\\index.md");
  expect(resolveMarkdownLinkTarget("C:/repo", "README.md", "https://example.test")).toBeNull();
  expect(resolveMarkdownLinkTarget("C:/repo", "README.md", "../outside.md")).toBeNull();
});

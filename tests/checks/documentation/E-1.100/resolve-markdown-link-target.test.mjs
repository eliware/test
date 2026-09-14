import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { resolveMarkdownLinkTarget } from "../../../../src/checks/documentation/E-1.100/resolve-markdown-link-target.mjs";

test("resolves local links and ignores external or escaping targets", () => {
  const root = resolve("fixture-repo");
  expect(resolveMarkdownLinkTarget(root, "README.md", "docs/index.md#top")).toBe(resolve("fixture-repo", "docs", "index.md"));
  expect(resolveMarkdownLinkTarget(root, "README.md", "https://example.test")).toBeNull();
  expect(resolveMarkdownLinkTarget(root, "README.md", "../outside.md")).toBeNull();
});

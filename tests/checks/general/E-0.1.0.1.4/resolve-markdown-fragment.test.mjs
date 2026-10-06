import { expect, test } from "@jest/globals";
import { hasMarkdownFragment } from "../../../../src/checks/general/E-0.1.0.1.4/resolve-markdown-fragment.mjs";

test("resolves duplicate, formatted, and setext headings", () => {
  const markdown = "# Repeat\n# Repeat\n## A [linked](page.md) heading\nSetext title\n---";
  expect(hasMarkdownFragment(markdown, "repeat-1")).toBe(true);
  expect(hasMarkdownFragment(markdown, "a-linked-heading")).toBe(true);
  expect(hasMarkdownFragment(markdown, "setext-title")).toBe(true);
});

test("resolves quoted and unquoted IDs but ignores code and comments", () => {
  const markdown =
    '<div id="Exact"></div>\n<span id=bare></span>\n```\n## hidden\n```\n<!-- <p id="comment"></p> -->';
  expect(hasMarkdownFragment(markdown, "Exact")).toBe(true);
  expect(hasMarkdownFragment(markdown, "bare")).toBe(true);
  expect(hasMarkdownFragment(markdown, "hidden")).toBe(false);
  expect(hasMarkdownFragment(markdown, "comment")).toBe(false);
});

test("rejects malformed fragment encoding", () => {
  expect(hasMarkdownFragment("# Good", "%E0%A4%A")).toBe(false);
});

test("does not resolve HTML IDs inside inline code", () => {
  expect(hasMarkdownFragment('`<span id="hidden"></span>`', "hidden")).toBe(false);
});

test("ignores HTML IDs in blockquoted code and handles blockquoted fences", () => {
  expect(hasMarkdownFragment('>     <span id="hidden"></span>', "hidden")).toBe(false);
  expect(hasMarkdownFragment('> ```md\n> <span id="hidden"></span>\n> ```', "hidden")).toBe(false);
});

import { expect, test } from "@jest/globals";
import { removeMarkdownCode } from "../../../../../src/checks/general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";

test("removes inline code and preserves its text when requested", () => {
  expect(removeMarkdownCode("`heading`")).toBe("");
  expect(removeMarkdownCode("`heading`", { preserveInlineCodeText: true })).toBe("heading");
});

test("removes fenced and indented code, including blockquoted code", () => {
  const markdown = [
    "Before.",
    "> ```js",
    "> [hidden](code.md)",
    "> ```",
    "    [also hidden](code.md)",
    "After.",
  ].join("\n");
  expect(removeMarkdownCode(markdown)).toContain("Before.");
  expect(removeMarkdownCode(markdown)).toContain("After.");
  expect(removeMarkdownCode(markdown)).not.toContain("hidden");
});

test("removes comments and retains nested list items", () => {
  expect(removeMarkdownCode("<!-- hidden -->\n- item\n    - nested item")).toContain(
    "    - nested item",
  );
  expect(removeMarkdownCode("<!-- hidden -->")).toBe("");
});

import { expect, test } from "@jest/globals";
import { extractInlineMarkdownLinks } from "../../../../../src/checks/general/E-0.1.0.1.4/extract-markdown/extract-inline-links.mjs";

test("extracts inline, HTML, and angle links in source order", () => {
  expect(
    extractInlineMarkdownLinks("[inline](one.md) <a href='two.md'> <https://example.org>"),
  ).toEqual([
    { index: 0, reference: "one.md" },
    { index: 17, reference: "two.md" },
    { index: 35, reference: "https://example.org" },
  ]);
});

test("extracts angle-bracket URLs with parentheses in query values", () => {
  expect(
    extractInlineMarkdownLinks("<https://example.org/?q=(x)> [link](<https://example.org/?q=(x)>)"),
  ).toEqual([
    { index: 0, reference: "https://example.org/?q=(x)" },
    { index: 29, reference: "https://example.org/?q=(x)" },
  ]);
});

test("does not treat images or non-anchor href attributes as links", () => {
  expect(extractInlineMarkdownLinks('![image](image.png) <img src="image.png">')).toEqual([]);
  expect(extractInlineMarkdownLinks('<div href="bad.md">bad</div>')).toEqual([]);
});

import { expect, test } from "@jest/globals";
import {
  extractMarkdownLinks,
  removeMarkdownCode,
} from "../../../../src/checks/general/E-0.1.0.1.4/extract-markdown-links.mjs";

test("extracts inline, reference, HTML, and angle links", () => {
  expect(
    extractMarkdownLinks(
      "[inline](one.md) [ref][id]\n[id]: two.md\n<a href='three.md'> <https://example.org>",
    ),
  ).toEqual([
    { reference: "one.md" },
    { reference: "two.md" },
    { reference: "three.md" },
    { reference: "https://example.org" },
  ]);
});

test("does not treat Markdown images or HTML image sources as links", () => {
  expect(extractMarkdownLinks('![image](image.png) <img src="image.png">')).toEqual([]);
});

test("keeps inline code text when requested", () => {
  expect(removeMarkdownCode("`heading`", { preserveInlineCodeText: true })).toBe("heading");
});

test("strips angle brackets from inline and reference destinations", () => {
  expect(extractMarkdownLinks("[inline](<guide.md>) [ref][id]\n[id]: <other.md>")).toEqual([
    { reference: "guide.md" },
    { reference: "other.md" },
  ]);
});

test("ignores links inside fenced and inline code", () => {
  expect(extractMarkdownLinks("`[inline](bad)`\n```md\n[block](bad)\n```\n[good](ok.md)")).toEqual([
    { reference: "ok.md" },
  ]);
});

test("ignores links inside indented code", () => {
  expect(extractMarkdownLinks("    [code](bad.md)\n[good](ok.md)")).toEqual([
    { reference: "ok.md" },
  ]);
});

test("ignores links inside blockquoted indented and fenced code", () => {
  expect(
    extractMarkdownLinks(
      ">     [indented](bad.md)\n> ```md\n> [fenced](bad.md)\n> ```\n[real](good.md)",
    ),
  ).toEqual([{ reference: "good.md" }]);
});

test("keeps nested list items out of indented code", () => {
  expect(extractMarkdownLinks("- item\n    - [nested](valid.md)")).toEqual([
    { reference: "valid.md" },
  ]);
});

test("ignores links inside HTML comments", () => {
  expect(extractMarkdownLinks("<!-- [hidden](missing.md) --> [shown](valid.md)")).toEqual([
    { reference: "valid.md" },
  ]);
});

test("retains unresolved reference links for validation", () => {
  expect(extractMarkdownLinks("[label][missing]")).toEqual([{ reference: null }]);
});

test("extracts shortcut and collapsed reference links", () => {
  expect(
    extractMarkdownLinks("[short] [collapsed][]\n\n[short]: one.md\n[collapsed]: two.md"),
  ).toEqual([{ reference: "one.md" }, { reference: "two.md" }]);
});

test("reports undefined shortcut reference syntax", () => {
  expect(extractMarkdownLinks("[missing]")).toEqual([]);
  expect(extractMarkdownLinks("[missing][]")).toEqual([{ reference: null }]);
});

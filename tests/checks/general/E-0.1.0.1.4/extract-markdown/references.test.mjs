import { expect, test } from "@jest/globals";
import {
  collectMarkdownReferenceDefinitions,
  extractMarkdownReferenceUses,
} from "../../../../../src/checks/general/E-0.1.0.1.4/extract-markdown/references.mjs";

test("collects normalized Markdown reference definitions", () => {
  expect(
    collectMarkdownReferenceDefinitions("[ Guide   Link ]: <guide.md>\n[other]: other.md"),
  ).toEqual(
    new Map([
      ["guide link", "guide.md"],
      ["other", "other.md"],
    ]),
  );
});

test("resolves shortcut, collapsed, explicit, and missing references", () => {
  const markdown =
    "[Guide Link] [other][] [missing][unknown] [inline](skip.md)\n[guide link]: guide.md";
  const definitions = collectMarkdownReferenceDefinitions(markdown);
  expect(
    extractMarkdownReferenceUses(markdown, definitions, /(?<!!)\[([^\]]+)\](?:\[([^\]]*)\])?/gu),
  ).toEqual([
    { index: 0, reference: "guide.md" },
    { index: 13, reference: null },
    { index: 23, reference: null },
  ]);
});

test("resolves image references through the same definition map", () => {
  const markdown = "![logo] ![missing][unknown]\n[logo]: logo.png";
  const definitions = collectMarkdownReferenceDefinitions(markdown);
  expect(
    extractMarkdownReferenceUses(markdown, definitions, /!\[([^\]]*)\](?:\[([^\]]*)\])?/gu),
  ).toEqual([
    { index: 0, reference: "logo.png" },
    { index: 8, reference: null },
  ]);
});

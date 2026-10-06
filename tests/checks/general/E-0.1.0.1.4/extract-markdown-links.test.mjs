import { expect, test } from "@jest/globals";
import { extractMarkdownLinks } from "../../../../src/checks/general/E-0.1.0.1.4/extract-markdown-links.mjs";

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

test("ignores links inside fenced and inline code", () => {
  expect(extractMarkdownLinks("`[inline](bad)`\n```md\n[block](bad)\n```\n[good](ok.md)")).toEqual([
    { reference: "ok.md" },
  ]);
});

test("retains unresolved reference links for validation", () => {
  expect(extractMarkdownLinks("[label][missing]")).toEqual([{ reference: null }]);
});

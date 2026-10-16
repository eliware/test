import { expect, test } from "@jest/globals";
import { extractMarkdownProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/markdown-prose.mjs";

test("keeps prose and link labels while it skips code, URLs, and HTML comments", () => {
  const source = [
    "# Heading",
    "",
    "Read [the guide](https://example.com) and `someCode`.",
    "",
    "```js",
    "const hidden = true;",
    "```",
    "<!-- hidden words -->",
    "Visible text.",
  ].join("\n");
  expect(extractMarkdownProse(source)).toEqual([
    { text: "Heading", line: 1, kind: "paragraph" },
    { text: "Read the guide and .", line: 3, kind: "paragraph" },
    { text: "Visible text.", line: 9, kind: "paragraph" },
  ]);
});

test("joins wrapped paragraphs and separates headings, lists, and tables", () => {
  expect(
    extractMarkdownProse(
      "A sentence\ncontinues here.\n\n- First item.\n- Second item.\n\n| Label | Value |",
    ),
  ).toEqual([
    { text: "A sentence continues here.", line: 1, kind: "paragraph" },
    { text: "First item.", line: 4, kind: "paragraph" },
    { text: "Second item.", line: 5, kind: "paragraph" },
    { text: "Label Value", line: 7, kind: "paragraph" },
  ]);
});

test("handles tilde fences, short closing markers, and multiline comments", () => {
  expect(
    extractMarkdownProse(
      [
        "~~~~js",
        "hidden code",
        "~~~",
        "still hidden",
        "~~~~",
        "Visible.",
        "<!-- hidden",
        "hidden -->",
        "Shown.",
      ].join("\n"),
    ),
  ).toEqual([
    { text: "Visible.", line: 6, kind: "paragraph" },
    { text: "Shown.", line: 9, kind: "paragraph" },
  ]);
});

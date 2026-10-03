import { expect, test } from "@jest/globals";
import { extractMarkdownLinks } from "../../../../src/checks/documentation/E-0.1.100/extract-markdown-links.mjs";

test("extracts inline, reference, and HTML links", () => {
  expect(
    extractMarkdownLinks(
      '[Docs](docs/index.md)\n[Docs][guide]\n[guide]: docs/index.md\n<a href="docs/index.md">x</a>',
    ),
  ).toEqual([
    { reference: "docs/index.md", referenceLabel: undefined, bareReference: undefined },
    { reference: "docs/index.md", referenceLabel: "guide", bareReference: undefined },
    { reference: "docs/index.md", referenceLabel: undefined, bareReference: undefined },
  ]);
});

test("extracts the supported link forms and ignores code and unsupported references", () => {
  expect(
    extractMarkdownLinks(
      [
        "![Image](assets/image.png)",
        "[Guide][start]",
        "[start]: docs/guide.md",
        "<a href=\"docs/page.html\">page</a> <img src='assets/logo.png'>",
        "<https://example.test/path> <mailto:help@example.test>",
        "[missing reference][missing]",
        "[shortcut]",
        "[collapsed][]",
        "`[inline code](missing.md)`",
        "~~~md",
        "[fenced code](missing.md)",
        "~~~~",
      ].join("\n"),
    ),
  ).toEqual([
    { reference: "assets/image.png", referenceLabel: undefined, bareReference: undefined },
    { reference: "docs/guide.md", referenceLabel: "start", bareReference: undefined },
    { reference: "docs/page.html", referenceLabel: undefined, bareReference: undefined },
    { reference: "assets/logo.png", referenceLabel: undefined, bareReference: undefined },
    { reference: "https://example.test/path", referenceLabel: undefined, bareReference: undefined },
    { reference: "mailto:help@example.test", referenceLabel: undefined, bareReference: undefined },
    { reference: undefined, referenceLabel: "missing", bareReference: undefined },
  ]);
});

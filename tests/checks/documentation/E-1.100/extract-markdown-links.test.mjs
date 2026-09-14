import { expect, test } from "@jest/globals";
import { extractMarkdownLinks } from "../../../../src/checks/documentation/E-1.100/extract-markdown-links.mjs";

test("extracts inline, reference, and HTML links", () => {
  expect(extractMarkdownLinks("[Docs](docs/index.md)\n[Docs][guide]\n[guide]: docs/index.md\n<a href=\"docs/index.md\">x</a>")).toEqual([
    { reference: "docs/index.md", referenceLabel: undefined, bareReference: undefined },
    { reference: "docs/index.md", referenceLabel: "guide", bareReference: undefined },
    { reference: "docs/index.md", referenceLabel: undefined, bareReference: undefined },
  ]);
});

import { expect, test } from "@jest/globals";
import createMarkdownReferencePolicy from "../../../../../../src/checks/general/E-0.1.0.1.4/extract-markdown/references/policy.mjs";

test("normalizes reference labels and recognizes definition lines", () => {
  const { definitionPattern, normalizeLabel } = createMarkdownReferencePolicy();
  expect(normalizeLabel(" Guide   Link ")).toBe("guide link");
  expect(definitionPattern.exec("[Guide]: guide.md")?.[1]).toBe("Guide");
});

import { expect, test } from "@jest/globals";
import { extractProse } from "../../../../src/checks/general/E-0.1.0.1.11/extract-prose.mjs";

test("selects the prose extractor by file extension", () => {
  expect(extractProse("README.md", "A sentence.")).toEqual([
    { text: "A sentence.", line: 1, kind: "paragraph" },
  ]);
  expect(extractProse("specs/rules.yaml", "description: A sentence.")).toEqual([
    { text: "A sentence.", line: 1, kind: "prose" },
  ]);
  expect(extractProse("metadata.json", '{"description":"A sentence."}')).toHaveLength(1);
  expect(extractProse("src/module.mjs", 'const message = "A sentence.";')).toHaveLength(1);
  expect(extractProse("image.png", "ignored")).toEqual([]);
});

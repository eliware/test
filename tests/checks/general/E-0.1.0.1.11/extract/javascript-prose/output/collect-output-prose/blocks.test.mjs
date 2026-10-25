import { expect, test } from "@jest/globals";
import { addOutputProseBlocks } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/blocks.mjs";

test("adds nonempty text blocks from supported output values", () => {
  const blocks = [];

  addOutputProseBlocks("Visible text", 3, blocks);
  addOutputProseBlocks("  ", 4, blocks);

  expect(blocks).toEqual([{ text: "Visible text", line: 3, kind: "prose" }]);
});

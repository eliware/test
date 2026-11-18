import { expect, test } from "@jest/globals";
import collectOutputPropertyProse from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/properties.mjs";

test("collects text from user-facing property assignments", () => {
  const blocks = [];
  collectOutputPropertyProse(
    {
      left: {
        type: "MemberExpression",
        object: { name: "element" },
        property: { name: "innerText" },
      },
      right: { type: "StringLiteral", value: "Ready" },
      loc: { start: { line: 5 } },
    },
    blocks,
  );
  expect(blocks).toMatchObject([{ text: "Ready", line: 5 }]);
});

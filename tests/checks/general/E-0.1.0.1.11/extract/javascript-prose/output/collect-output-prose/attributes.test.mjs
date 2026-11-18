import { expect, test } from "@jest/globals";
import collectOutputAttributeProse from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/attributes.mjs";

test("collects user-facing attribute values", () => {
  const blocks = [];
  collectOutputAttributeProse(
    {
      callee: {
        type: "MemberExpression",
        property: { name: "setAttribute" },
      },
      arguments: [
        { type: "StringLiteral", value: "alt" },
        { type: "StringLiteral", value: "Image description" },
      ],
      loc: { start: { line: 6 } },
    },
    blocks,
  );
  expect(blocks).toMatchObject([{ text: "Image description", line: 6 }]);
});

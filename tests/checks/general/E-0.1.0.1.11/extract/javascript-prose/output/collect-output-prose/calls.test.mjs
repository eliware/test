import { expect, test } from "@jest/globals";
import collectOutputCallProse from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/calls.mjs";

test("collects text from user-facing output calls", () => {
  const blocks = [];
  collectOutputCallProse(
    {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "console" },
        property: { name: "log" },
      },
      arguments: [{ type: "StringLiteral", value: "Ready" }],
      loc: { start: { line: 4 } },
    },
    blocks,
  );
  expect(blocks).toMatchObject([{ text: "Ready", line: 4, kind: "prose" }]);
});

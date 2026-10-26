import { expect, test } from "@jest/globals";
import { isReplyOutputCall } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls/replies.mjs";

const call = (property) => ({
  type: "MemberExpression",
  object: { type: "Identifier", name: "interaction" },
  property: { type: "Identifier", name: property },
  computed: false,
});

test.each([
  [call("reply"), true],
  [call("editReply"), true],
  [call("followUp"), true],
  [call("send"), false],
])("classifies reply output calls", (callee, expected) => {
  expect(isReplyOutputCall(callee)).toBe(expected);
});

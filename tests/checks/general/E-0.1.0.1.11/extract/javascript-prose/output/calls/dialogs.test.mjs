import { expect, test } from "@jest/globals";
import { isDialogOutputCall } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls/dialogs.mjs";

test.each([
  [{ type: "Identifier", name: "alert" }, true],
  [{ type: "Identifier", name: "custom" }, false],
  [
    {
      type: "MemberExpression",
      object: { type: "Identifier", name: "window" },
      property: { type: "Identifier", name: "prompt" },
      computed: false,
    },
    true,
  ],
])("classifies dialog output calls", (callee, expected) => {
  expect(isDialogOutputCall(callee)).toBe(expected);
});

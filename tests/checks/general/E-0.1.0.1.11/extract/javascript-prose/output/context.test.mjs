import { expect, test } from "@jest/globals";
import {
  isUserFacingAttribute,
  isUserFacingOutputCall,
  isUserFacingOutputProperty,
} from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/context.mjs";

test.each(["alt", "aria-label", "placeholder", "title"])("accepts visible attribute %s", (name) => {
  expect(isUserFacingAttribute(name)).toBe(true);
});

test.each(["className", "data-label", "style", undefined])(
  "rejects non-visible attribute %s",
  (name) => {
    expect(isUserFacingAttribute(name)).toBe(false);
  },
);

test.each([
  [{ type: "Identifier", name: "alert" }, true],
  [{ type: "Identifier", name: "custom" }, false],
  [member("console", "log"), true],
  [member("console", "table"), false],
  [member(member("process", "stdout"), "write"), true],
  [member(member("process", "stderr"), "write"), true],
  [member(member("process", "pid"), "write"), false],
  [member(member("process", "stdout"), "read"), false],
  [member("window", "prompt"), true],
  [member("window", "open"), false],
  [member("readline", "question"), true],
  [member("readline", "close"), false],
  [member("interaction", "reply"), true],
  [member("interaction", "editReply"), true],
  [member("client", "send"), false],
  [member("client", "query"), false],
  [{ type: "OptionalCallExpression" }, false],
])("classifies supported output call %j", (callee, expected) => {
  expect(isUserFacingOutputCall(callee)).toBe(expected);
});

test.each([
  [member("element", "textContent"), true],
  [member("document", "title"), true],
  [{ ...member("element", "ariaLabel"), computed: true, property: string("ariaLabel") }, true],
  [member("element", "className"), false],
  [{ type: "Identifier", name: "textContent" }, false],
])("classifies displayed output property %j", (target, expected) => {
  expect(isUserFacingOutputProperty(target)).toBe(expected);
});

function member(object, property) {
  return {
    type: "MemberExpression",
    object: typeof object === "string" ? { type: "Identifier", name: object } : object,
    property: { type: "Identifier", name: property },
    computed: false,
  };
}

function string(value) {
  return { type: "StringLiteral", value };
}

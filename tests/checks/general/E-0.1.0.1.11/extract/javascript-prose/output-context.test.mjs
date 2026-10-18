import { expect, test } from "@jest/globals";
import {
  collectOutputText,
  isUserFacingAttribute,
  isUserFacingOutputCall,
  isUserFacingOutputProperty,
} from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output-context.mjs";

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

test("collects direct strings, template text, and concatenated output text", () => {
  expect(collectOutputText("Show the saved value.")).toEqual(["Show the saved value."]);
  expect(collectOutputText(string("Enter a valid name."))).toEqual(["Enter a valid name."]);
  expect(collectOutputText(template("Choose a value for ", ""))).toEqual(["Choose a value for "]);
  expect(
    collectOutputText({
      ...template("Show a value"),
      quasis: [{ value: { cooked: null, raw: "Show a value" } }],
    }),
  ).toEqual(["Show a value"]);
  expect(collectOutputText(binary(string("Choose a "), string("valid option.")))).toEqual([
    "Choose a ",
    "valid option.",
  ]);
  expect(collectOutputText({ ...binary(string("part"), string("value")), operator: "-" })).toEqual(
    [],
  );
  expect(
    collectOutputText({ type: "TaggedTemplateExpression", quasi: template("Show a value") }),
  ).toEqual(["Show a value"]);
});

test.each([undefined, 3, { type: "Identifier", name: "message" }, { type: "ObjectExpression" }])(
  "does not infer prose from nonliteral data %j",
  (value) => {
    expect(collectOutputText(value)).toEqual([]);
  },
);

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

function template(...values) {
  return {
    type: "TemplateLiteral",
    quasis: values.map((value) => ({ value: { cooked: value, raw: value } })),
  };
}

function binary(left, right) {
  return { type: "BinaryExpression", operator: "+", left, right };
}

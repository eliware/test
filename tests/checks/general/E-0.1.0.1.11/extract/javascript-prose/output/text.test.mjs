import { expect, test } from "@jest/globals";
import { collectOutputText } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/text.mjs";

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

import { expect, test } from "@jest/globals";
import { bindPattern, staticValue } from "../../../../../src/checks/general/E-1/E-1.10/knit-static-values.mjs";

test("resolves static strings, arrays, and destructured bindings", () => {
  const bindings = new Map([["command", "npm"]]);
  expect(staticValue({ type: "Identifier", name: "command" }, bindings)).toBe("npm");
  expect(staticValue({ type: "ArrayExpression", elements: [{ type: "StringLiteral", value: "ci" }] }, bindings)).toEqual(["ci"]);
  const target = new Map();
  bindPattern({ type: "ArrayPattern", elements: [{ type: "Identifier", name: "name" }] }, ["npm"], target);
  expect(target.get("name")).toBe("npm");
});

test("rejects dynamic values and resolves static templates", () => {
  const bindings = new Map();
  expect(staticValue(null, bindings)).toBeUndefined();
  expect(staticValue({ type: "TemplateLiteral", expressions: [], quasis: [{ value: { cooked: "npm" } }] }, bindings)).toBe("npm");
  expect(staticValue({ type: "TemplateLiteral", expressions: [{}], quasis: [{ value: { cooked: "npm" } }] }, bindings)).toBeUndefined();
  expect(staticValue({ type: "ArrayExpression", elements: [null] }, bindings)).toBeUndefined();
  expect(staticValue({ type: "Identifier", name: "missing" }, bindings)).toBeUndefined();
  expect(staticValue({ type: "NumericLiteral", value: 1 }, bindings)).toBeUndefined();
});

test("binds only array identifier patterns", () => {
  const bindings = new Map();
  bindPattern({ type: "ObjectPattern", properties: [] }, ["value"], bindings);
  bindPattern({ type: "ArrayPattern", elements: [{ type: "NumericLiteral" }, null] }, ["value"], bindings);
  bindPattern({ type: "ArrayPattern", elements: [{ type: "Identifier", name: "value" }] }, "not an array", bindings);
  expect(bindings).toEqual(new Map());
});

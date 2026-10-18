import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { isHttpHeaderValue } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/http-header-value.mjs";

function callValue(source) {
  const call = parse(source).program.body[0].expression;
  return [call.arguments[1], call];
}

test.each([
  'reply.header("content-disposition", "attachment; filename=mail.txt")',
  'reply.header("content-security-policy", "default-src none; base-uri none")',
  'response.setHeader("content-type", "text/plain; charset=utf-8")',
])("recognizes protocol values in header calls: %s", (source) => {
  const [value, call] = callValue(source);
  expect(isHttpHeaderValue(value, call)).toBe(true);
});

test.each([
  'reply.type("text/javascript; charset=utf-8")',
  'reply.type("text/plain; version=0.0.4")',
  "reply.type(`text/plain; charset=${charset}`)",
  'reply["type"]("text/html")',
])("recognizes MIME values in reply.type calls: %s", (source) => {
  const call = parse(source).program.body[0].expression;
  expect(isHttpHeaderValue(call.arguments[0], call)).toBe(true);
});

test("recognizes protocol values in header objects", () => {
  const property = parse(
    'const headers = { "content-disposition": "attachment; filename=mail.txt" };',
  ).program.body[0].declarations[0].init.properties[0];
  expect(isHttpHeaderValue(property.value, property)).toBe(true);
});

test("recognizes computed header methods and rejects non-header values", () => {
  const [computedValue, computedCall] = callValue(
    'reply["header"]("content-type", "text/plain; charset=utf-8")',
  );
  expect(isHttpHeaderValue(computedValue, computedCall)).toBe(true);
  const dynamicNameCall = parse('reply.header(headerName, "header value")').program.body[0]
    .expression;
  expect(isHttpHeaderValue(dynamicNameCall.arguments[1], dynamicNameCall)).toBe(true);
  const [wrongMethodValue, wrongMethodCall] = callValue('reply.send(200, "application/json")');
  expect(isHttpHeaderValue(wrongMethodValue, wrongMethodCall)).toBe(false);
  const [unknownNameValue, unknownNameCall] = callValue('reply.header("bad header", "human text")');
  expect(isHttpHeaderValue(unknownNameValue, unknownNameCall)).toBe(false);
  const mimeCall = parse('reply.type("Describe this value.")').program.body[0].expression;
  expect(isHttpHeaderValue(mimeCall.arguments[0], mimeCall)).toBe(false);
  const bareMimeCall = parse('type("text/plain")').program.body[0].expression;
  expect(isHttpHeaderValue(bareMimeCall.arguments[0], bareMimeCall)).toBe(false);
  const variableMimeCall = parse("reply.type(mimeType)").program.body[0].expression;
  expect(isHttpHeaderValue(variableMimeCall.arguments[0], variableMimeCall)).toBe(false);
});

test("does not classify unrelated values as headers", () => {
  const [value, call] = callValue('reply.send("Explain this response.")');
  expect(isHttpHeaderValue(value, call)).toBe(false);
  const property = parse("const values = { description: 'human text' };").program.body[0]
    .declarations[0].init.properties[0];
  expect(isHttpHeaderValue(property.value, property)).toBe(false);
  const bareCall = parse('header("content-type", "text/plain")').program.body[0].expression;
  expect(isHttpHeaderValue(bareCall.arguments[1], bareCall)).toBe(false);
});

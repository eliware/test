import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import readProperties from "../../../../../src/checks/web/E-0.1.6.1.2/parse-webpack-config/read-properties.mjs";

function objectFrom(source) {
  return parse(`export default ${source}`, { sourceType: "module" }).program.body[0].declaration;
}

test("reads simple properties and rejects unsupported object shapes", () => {
  expect(readProperties(objectFrom('{ mode: "production", "target": "web" }'))?.size).toBe(2);
  for (const source of [
    "{ ...base }",
    "{ [key]: 1 }",
    "{ mode }",
    "{ mode: 1, mode: 2 }",
    "{ 1: 2 }",
  ]) {
    expect(readProperties(objectFrom(source))).toBeNull();
  }
  expect(readProperties(null)).toBeNull();
});

import { expect, test } from "@jest/globals";
import { parseBundledYamlDocuments } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/parse-bundled-yaml-documents.mjs";

test("parses each bounded YAML document into a value", () => {
  expect(parseBundledYamlDocuments("name: first\n---\nname: second", "specs/test.yaml")).toEqual([
    { name: "first" },
    { name: "second" },
  ]);
});

test("reports YAML syntax errors from bundled documents", () => {
  expect(() => parseBundledYamlDocuments("value: [", "specs/test.yaml")).toThrow();
});

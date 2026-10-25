import { expect, test } from "@jest/globals";
import { parseBundledYamlDocuments } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/parse-bundled-yaml-documents.mjs";

test("parses each bounded YAML document into a value", () => {
  expect(parseBundledYamlDocuments("name: first\n---\nname: second", "specs/test.yaml")).toEqual([
    { name: "first" },
    { name: "second" },
  ]);
});

test("rejects YAML limit violations and parse errors", () => {
  expect(() => parseBundledYamlDocuments(`value: ${"x".repeat(110)}`, "specs/test.yaml")).toThrow(
    "specs/test.yaml line 1 has",
  );
  expect(() => parseBundledYamlDocuments("value: [", "specs/test.yaml")).toThrow();
});

import { expect, test } from "@jest/globals";
import parseBoundedYamlValue from "../../../../../src/validation/shared/yaml/parse-bounded-yaml-documents/parse-bounded-yaml-value.mjs";

test("returns values and rejects multiple documents and syntax errors", () => {
  expect(parseBoundedYamlValue("name: example", "fixture.yml")).toEqual({ name: "example" });
  expect(parseBoundedYamlValue("", "empty.yml")).toBeNull();
  expect(() => parseBoundedYamlValue("---\na: 1\n---\nb: 2", "multi.yml")).toThrow(
    "must contain one YAML document",
  );
  expect(() => parseBoundedYamlValue("a: [", "invalid.yml")).toThrow();
});

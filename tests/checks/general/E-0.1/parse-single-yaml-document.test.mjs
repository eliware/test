import { expect, test } from "@jest/globals";
import { parseSingleYamlDocument } from "../../../../src/checks/general/E-0.1/parse-single-yaml-document.mjs";

test("parses exactly one YAML document", () => {
  expect(parseSingleYamlDocument("name: validation\njobs: {}\n")).toEqual({
    name: "validation",
    jobs: {},
  });
});

test("rejects multiple YAML documents", () => {
  expect(() => parseSingleYamlDocument("name: ci\n---\nname: second\n")).toThrow(
    "Expected exactly one YAML document; found 2.",
  );
});

test("rejects malformed YAML", () => {
  expect(() => parseSingleYamlDocument("jobs: [\n")).toThrow();
});

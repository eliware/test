import { expect, jest, test } from "@jest/globals";
import { parseDocument } from "yaml";
import { visitYamlScalars } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/collect.mjs";

test("visits scalar YAML values with normalized mapping paths", () => {
  const document = parseDocument("Description: text\nitems:\n  - name: first\n  - name: second\n");
  const values = [];
  visitYamlScalars(document.contents, (node, path) => values.push([node.value, path]));

  expect(values).toEqual([
    ["text", ["description"]],
    ["first", ["items", "name"]],
    ["second", ["items", "name"]],
  ]);
});

test("visits a scalar root with an empty path", () => {
  const values = [];
  visitYamlScalars(parseDocument("plain text").contents, (node, path) =>
    values.push([node.value, path]),
  );

  expect(values).toEqual([["plain text", []]]);
});

test("ignores a missing YAML node", () => {
  const visit = jest.fn();
  visitYamlScalars(null, visit);

  expect(visit).not.toHaveBeenCalled();
});

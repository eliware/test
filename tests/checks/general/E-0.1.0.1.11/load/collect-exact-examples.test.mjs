import { expect, test } from "@jest/globals";
import { parseDocument } from "yaml";
import collectExactExamples from "../../../../../src/checks/general/E-0.1.0.1.11/load/collect-exact-examples.mjs";
test("collects and normalizes examples from nested YAML nodes", () => {
  const exact = new Set();
  collectExactExamples(
    parseDocument(
      'description: ignored\nexamples: ["A first sentence.", { text: "A second sentence."}]',
    ).contents,
    exact,
  );
  expect(exact).toEqual(new Set(["a first sentence", "a second sentence"]));
});
test("ignores non-string example values", () => {
  const exact = new Set();
  collectExactExamples(parseDocument("examples: [12, null, true]").contents, exact);
  expect(exact).toEqual(new Set());
});

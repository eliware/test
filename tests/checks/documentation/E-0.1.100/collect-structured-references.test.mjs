import { expect, test } from "@jest/globals";
import { collectStructuredReferences } from "../../../../src/checks/documentation/E-0.1.100/collect-structured-references.mjs";

test("collects nested local path fields", () => {
  expect(
    collectStructuredReferences({
      path: "./index.json",
      items: [{ path: "./local.json" }],
      structuredDocuments: [{ path: "./record.json" }],
    }),
  ).toEqual(["./index.json", "./local.json", "./record.json"]);
});

test("ignores primitive documents and path fields that are not strings", () => {
  expect(collectStructuredReferences(null)).toEqual([]);
  expect(collectStructuredReferences({ path: 42 })).toEqual([]);
});

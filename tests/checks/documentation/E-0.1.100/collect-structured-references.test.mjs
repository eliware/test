import { expect, test } from "@jest/globals";
import { collectStructuredReferences } from "../../../../src/checks/documentation/E-0.1.100/collect-structured-references.mjs";

test("collects nested path fields and marks crosslinks at every depth", () => {
  expect(collectStructuredReferences({
    path: "./index.json",
    items: [{ path: "./local.json" }],
    crosslinks: [{ path: "../docs/authority-map.json", nested: { path: "../test/README.md" } }],
  })).toEqual([
    { path: "./index.json", crossRepository: false },
    { path: "./local.json", crossRepository: false },
    { path: "../docs/authority-map.json", crossRepository: true },
    { path: "../test/README.md", crossRepository: true },
  ]);
});

test("ignores primitive documents and path fields that are not strings", () => {
  expect(collectStructuredReferences(null)).toEqual([]);
  expect(collectStructuredReferences({ path: 42 })).toEqual([]);
});

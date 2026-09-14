import { expect, test } from "@jest/globals";
import { collectRegisteredExternalReferences } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/collect-registered-external-references.mjs";

test("registers only valid crosslinks", () => {
  expect(collectRegisteredExternalReferences({ crosslinks: [null, {}, { path: 4 }, { path: "x.json" }] })).toEqual(new Set(["x.json"]));
  expect(collectRegisteredExternalReferences(null)).toEqual(new Set());
  expect(collectRegisteredExternalReferences([null, "text", { value: true }])).toEqual(new Set());
});

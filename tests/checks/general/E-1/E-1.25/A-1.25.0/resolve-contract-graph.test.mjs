import { expect, test } from "@jest/globals";
import { referencesResolve } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/resolve-contract-graph.mjs";

test("resolves contract reference graphs", () => {
  expect(referencesResolve([{ id: "C-1", dependencies: [] }])).toBe(true);
  expect(referencesResolve([{ id: "C-1", dependencies: ["C-2"] }])).toBe(false);
  expect(referencesResolve([
    { id: "C-1", dependencies: ["C-2"] },
    { id: "C-2", dependencies: ["C-1"] },
  ])).toBe(false);
});

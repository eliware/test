import { expect, test } from "@jest/globals";
import { validateContractGraph } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-graph.mjs";

const contract = (id, extra = {}) => ({ id, ...extra });

test("accepts a resolvable acyclic contract graph", () => {
  expect(
    validateContractGraph([contract("C-1.1"), contract("C-1.2", { dependencies: ["C-1.1"] })]),
  ).toBeNull();
});

test("rejects unresolved and cyclic contract references", () => {
  expect(validateContractGraph([contract("C-1.1", { parent: "C-9.9" })])).toContain("resolve");
  expect(
    validateContractGraph([
      contract("C-1.1", { dependencies: ["C-1.2"] }),
      contract("C-1.2", { dependencies: ["C-1.1"] }),
    ]),
  ).toContain("cycles");
});

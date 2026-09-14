import { expect, test } from "@jest/globals";
import { validateDirectiveTree } from "../../../../../src/checks/general/E-1/E-1.22/validate-directive-tree.mjs";

test("rejects malformed directive nodes and ancestry violations", () => {
  const errors = validateDirectiveTree([
    { id: "E-1", directives: "not an array" },
    { id: "E-2", directives: [{ id: "A-9.1" }] },
    { id: "E-3", directives: [{ id: "E-3.1", directives: [{ id: "A-3.1.1" }] }] },
    { id: "E-4", directives: [{ id: "A-4.1", directives: [{ id: "E-4.1.1" }] }] },
    { id: "E-5", directives: [{ id: "A-5.1" }, { id: "invalid" }, {}] },
  ]);
  expect(errors.join(" ")).toContain("must be nested");
});

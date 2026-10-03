import { expect, test } from "@jest/globals";
import { validateDirectiveTree } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-directive-tree.mjs";

test("rejects malformed directive nodes and ancestry violations", () => {
  const errors = validateDirectiveTree([
    { id: "E-0.1", directives: "not an array" },
    { id: "E-2", directives: [{ id: "A-9.1" }] },
    { id: "E-3", directives: [{ id: "E-3.1", directives: [{ id: "A-3.1.1" }] }] },
    { id: "E-4", directives: [{ id: "A-4.1", directives: [{ id: "E-4.1.1" }] }] },
    { id: "E-5", directives: [{ id: "A-5.1" }, { id: "invalid" }, {}] },
  ]);
  expect(errors.join(" ")).toContain("must be nested");
});

test("rejects top-level AI rules and non-array child collections", () => {
  expect(validateDirectiveTree([{ id: "A-0.1" }, { id: "E-1", directives: "invalid" }])).toEqual(
    expect.arrayContaining([
      "Top-level directive A-0.1 must be an E-rule.",
      "A-rule A-0.1 must have an E-rule ancestor.",
      "Directive E-1.directives must be an array.",
    ]),
  );
});

test("stops traversal at malformed directive collections", () => {
  expect(
    validateDirectiveTree([
      { id: "E-1", directives: "characters are not child directives" },
      { id: "E-2", directives: [{ id: "E-2.1", directives: ["not a record"] }] },
    ]),
  ).toEqual([
    "Directive E-1.directives must be an array.",
    "Every directive must have a valid E- or A-prefixed ID.",
  ]);
});

test("requires complete numeric parent segments in nested directive IDs", () => {
  for (const [parentId, childId] of [["E-1.2", "A-1.20.3"]]) {
    expect(validateDirectiveTree([{ id: parentId, directives: [{ id: childId }] }])).toContain(
      `Directive ${childId} must be nested under ${parentId}.`,
    );
  }
});

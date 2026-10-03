import { expect, test } from "@jest/globals";
import { patternHasRequire } from "../../../../../src/checks/general/E-0.1/E-0.1.20/pattern-has-require-binding.mjs";

test("recognizes require in every supported binding-pattern position", () => {
  const requireIdentifier = { type: "Identifier", name: "require" };
  expect(patternHasRequire(requireIdentifier)).toBe(true);
  expect(patternHasRequire({ type: "RestElement", argument: requireIdentifier })).toBe(true);
  expect(patternHasRequire({ type: "AssignmentPattern", left: requireIdentifier })).toBe(true);
  expect(patternHasRequire({ type: "ArrayPattern", elements: [requireIdentifier] })).toBe(true);
  expect(
    patternHasRequire({
      type: "ObjectPattern",
      properties: [
        {
          type: "ObjectProperty",
          key: requireIdentifier,
          value: { type: "Identifier", name: "local" },
        },
      ],
    }),
  ).toBe(false);
  expect(
    patternHasRequire({
      type: "ObjectPattern",
      properties: [
        {
          type: "ObjectProperty",
          key: { type: "Identifier", name: "local" },
          value: requireIdentifier,
        },
      ],
    }),
  ).toBe(true);
  expect(
    patternHasRequire({
      type: "ObjectPattern",
      properties: [{ type: "RestElement", argument: requireIdentifier }],
    }),
  ).toBe(true);
});

test("returns false for missing or non-binding nodes", () => {
  expect(patternHasRequire(null)).toBe(false);
  expect(patternHasRequire({ type: "PrivateName" })).toBe(false);
  expect(patternHasRequire({ type: "Identifier", name: "local" })).toBe(false);
});

test("handles deeply nested binding patterns without recursion", () => {
  let pattern = { type: "Identifier", name: "require" };
  for (let index = 0; index < 20_000; index += 1) {
    pattern = { type: "RestElement", argument: pattern };
  }
  expect(patternHasRequire(pattern)).toBe(true);
});

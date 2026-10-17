import { expect, test } from "@jest/globals";
import { trackNamespaceAlias } from "../../../../src/validation/harness/test-write-policy/track-namespace-alias.mjs";

test("tracks identifier aliases of a restricted namespace", () => {
  const aliases = new Set(["fs"]);
  expect(
    trackNamespaceAlias(
      { id: { type: "Identifier", name: "io" }, init: { type: "Identifier", name: "fs" } },
      aliases,
    ),
  ).toBe(true);
  expect(aliases).toEqual(new Set(["fs", "io"]));
});

test("rejects non-identifier bindings and unrelated identifiers", () => {
  const aliases = new Set(["fs"]);
  expect(trackNamespaceAlias({ id: { type: "ObjectPattern" } }, aliases)).toBe(false);
  expect(
    trackNamespaceAlias(
      { id: { type: "Identifier", name: "io" }, init: { type: "StringLiteral" } },
      aliases,
    ),
  ).toBe(false);
  expect(
    trackNamespaceAlias(
      { id: { type: "Identifier", name: "io" }, init: { type: "Identifier", name: "other" } },
      aliases,
    ),
  ).toBe(false);
  expect(aliases).toEqual(new Set(["fs"]));
});

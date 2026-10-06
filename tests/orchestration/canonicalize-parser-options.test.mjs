import { expect, test } from "@jest/globals";
import {
  canonicalizeParserOptions,
  uncacheableParserOptions,
} from "../../src/orchestration/canonicalize-parser-options.mjs";

test("canonicalizes scalar values without conflating JSON types", () => {
  expect(canonicalizeParserOptions(null)).not.toEqual(canonicalizeParserOptions(undefined));
  expect(canonicalizeParserOptions("1")).not.toEqual(canonicalizeParserOptions(1));
  expect(canonicalizeParserOptions(false)).not.toEqual(canonicalizeParserOptions(0));
  expect(canonicalizeParserOptions(-0)).not.toEqual(canonicalizeParserOptions(0));
  expect(canonicalizeParserOptions(Infinity)).toBe(uncacheableParserOptions);
  expect(canonicalizeParserOptions(1n)).toBe(uncacheableParserOptions);
  expect(canonicalizeParserOptions(Symbol("option"))).toBe(uncacheableParserOptions);
  expect(canonicalizeParserOptions(() => {})).toBe(uncacheableParserOptions);
});

test("canonicalizes plain objects by sorted own data properties", () => {
  const first = canonicalizeParserOptions({ second: ["x", null], first: true });
  const reordered = canonicalizeParserOptions({ first: true, second: ["x", null] });
  expect(first).toEqual(reordered);
  expect(canonicalizeParserOptions(Object.assign(Object.create(null), { value: 1 }))).toEqual(
    canonicalizeParserOptions({ value: 1 }),
  );
});

test("bypasses option graphs it cannot serialize without collisions", () => {
  const sparse = Array(1);
  const sparseWithExtra = Array(2);
  sparseWithExtra[1] = "value";
  sparseWithExtra.extra = true;
  const extended = Object.assign([], { extra: true });
  const symbolKeyed = { [Symbol("option")]: true };
  const accessor = Object.defineProperty({}, "option", { enumerable: true, get: () => true });
  const hidden = Object.defineProperty({}, "option", { value: true });
  const circular = {};
  circular.self = circular;
  const shared = {};

  for (const value of [
    new Map(),
    new Set(),
    new Date(),
    sparse,
    sparseWithExtra,
    extended,
    symbolKeyed,
    accessor,
    hidden,
    circular,
    { first: shared, second: shared },
    [{ nested: new Map() }],
  ]) {
    expect(canonicalizeParserOptions(value)).toBe(uncacheableParserOptions);
  }
});

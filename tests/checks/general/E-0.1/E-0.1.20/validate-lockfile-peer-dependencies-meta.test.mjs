import { expect, test } from "@jest/globals";
import { validateLockfilePeerDependenciesMeta } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-lockfile-peer-dependencies-meta.mjs";

test("accepts absent and well-formed peer metadata", () => {
  expect(validateLockfilePeerDependenciesMeta("entry", {})).toEqual([]);
  expect(
    validateLockfilePeerDependenciesMeta("entry", {
      peerDependenciesMeta: { optional: { optional: true }, required: {} },
    }),
  ).toEqual([]);
});

test("rejects malformed metadata objects and entries", () => {
  expect(validateLockfilePeerDependenciesMeta("entry", { peerDependenciesMeta: [] })).toEqual([
    "package-lock.json entry entry has invalid peerDependenciesMeta.",
  ]);
  expect(
    validateLockfilePeerDependenciesMeta("entry", {
      peerDependenciesMeta: { nullValue: null, array: [], badFlag: { optional: "yes" } },
    }),
  ).toEqual([
    "package-lock.json entry entry has invalid peerDependenciesMeta entry nullValue.",
    "package-lock.json entry entry has invalid peerDependenciesMeta entry array.",
    "package-lock.json entry entry has invalid peerDependenciesMeta entry badFlag.",
  ]);
});

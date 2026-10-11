import { findRegisteredJestTest } from "./find-registered-jest-test.mjs";

export function hasRegisteredJestTest(program, bindings) {
  return findRegisteredJestTest(program, bindings);
}

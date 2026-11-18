import findRegisteredJestTest from "../find/registered-jest-test.mjs";
export default function hasRegisteredJestTest(program, bindings) {
  return findRegisteredJestTest(program, bindings);
}

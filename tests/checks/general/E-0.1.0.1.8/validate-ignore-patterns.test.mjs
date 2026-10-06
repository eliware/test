import { expect, test } from "@jest/globals";
import {
  requiredIgnoreCases,
  validateRequiredIgnoreRules,
} from "../../../../src/checks/general/E-0.1.0.1.8/validate-ignore-patterns.mjs";

const rules = `node_modules/
.git/
coverage/
dist/
build/
generated/
artifacts/
test-results/
.env*
!.env*.example
.DS_Store
Thumbs.db`;

test("defines universal ignore rules and nested probes", () => {
  expect(validateRequiredIgnoreRules(rules)).toEqual([]);
  expect(requiredIgnoreCases.some(([path]) => path.includes("level/five"))).toBe(false);
  expect(requiredIgnoreCases.length).toBeGreaterThan(40);
});

test("rejects missing rules and other negation exceptions", () => {
  expect(validateRequiredIgnoreRules("node_modules/\n!.env.local\n")[0]).toContain(
    "unsafe negations: !.env.local",
  );
});

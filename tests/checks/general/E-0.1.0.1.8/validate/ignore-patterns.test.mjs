import { expect, test } from "@jest/globals";
import {
  requiredIgnoreCases,
  validateRequiredIgnoreRules,
} from "../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns.mjs";

const rules = `node_modules/
.git/
coverage/
dist/
build/
generated/
artifacts/
test-results/
.DS_Store
Thumbs.db`;

test("defines universal ignore rules and nested probes", () => {
  expect(validateRequiredIgnoreRules(rules)).toEqual([]);
  expect(requiredIgnoreCases.some(([path]) => path.includes("level/five"))).toBe(false);
  expect(requiredIgnoreCases.length).toBeGreaterThan(30);
});

test("allows repository-specific ignore rules", () => {
  expect(validateRequiredIgnoreRules(`${rules}\n!local-example.txt`)).toEqual([]);
  expect(validateRequiredIgnoreRules(`${rules}\n!package.json\n!src/generated.txt`)).toEqual([]);
  expect(validateRequiredIgnoreRules(`${rules}\n!`)).toEqual([]);
});

test("reports negations that restore protected paths", () => {
  expect(validateRequiredIgnoreRules(`${rules}\n!nested/coverage/`)[0]).toContain(
    "must not restore protected paths",
  );
});

test("allows negations that precede the required ignore rules", () => {
  expect(validateRequiredIgnoreRules(`!nested/node_modules/\n${rules}`)).toEqual([]);
});

test("reports missing ignore rules and accepts recursive directory patterns", () => {
  expect(validateRequiredIgnoreRules("!local-example.txt")[0]).toContain(
    ".gitignore must define universal rules for",
  );
  expect(
    validateRequiredIgnoreRules(
      "**/node_modules\n**/.git\n**/coverage\n**/dist\n**/build\n**/generated\n**/artifacts\n**/test-results\n**/.DS_Store\n**/Thumbs.db",
    ),
  ).toEqual([]);
  expect(
    validateRequiredIgnoreRules(
      "**/node_modules/**\n**/.git/**\n**/coverage/**\n**/dist/**\n**/build/**\n**/generated/**\n**/artifacts/**\n**/test-results/**\n**/.DS_Store\n**/Thumbs.db",
    ),
  ).toEqual([]);
  expect(validateRequiredIgnoreRules("coverage/**")[0]).toContain(
    ".gitignore must define universal rules for",
  );
});

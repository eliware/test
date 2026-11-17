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
const validRules = `${rules}\n.env*\n!.env.example\n!**/.env.example`;

test("defines universal ignore rules and nested probes", () => {
  expect(validateRequiredIgnoreRules(validRules)).toEqual([]);
  expect(requiredIgnoreCases.some(([path]) => path.includes("level/five"))).toBe(false);
  expect(requiredIgnoreCases.length).toBeGreaterThan(30);
});

test("allows repository-specific ignore rules", () => {
  expect(validateRequiredIgnoreRules(`${validRules}\n!local-example.txt`)).toEqual([]);
  expect(validateRequiredIgnoreRules(`${validRules}\n!package.json\n!src/generated.txt`)).toEqual(
    [],
  );
  expect(validateRequiredIgnoreRules(`${validRules}\n!`)).toEqual([]);
});

test("requires the local environment ignore rule and example exception", () => {
  expect(validateRequiredIgnoreRules(`${rules}\n.env*\n!.env.example`)).toContain(
    ".gitignore must include .env*, !.env.example, and !**/.env.example.",
  );
  expect(validateRequiredIgnoreRules(`${rules}\n.env*\n!**/.env.example`)).toContain(
    ".gitignore must include .env*, !.env.example, and !**/.env.example.",
  );
});

test("reports negations that restore protected paths", () => {
  expect(validateRequiredIgnoreRules(`${validRules}\n!nested/coverage/`)[0]).toContain(
    "must not restore protected paths",
  );
});

test("allows negations that precede the required ignore rules", () => {
  expect(validateRequiredIgnoreRules(`!nested/node_modules/\n${validRules}`)).toEqual([]);
});

test("reports missing ignore rules and accepts recursive directory patterns", () => {
  expect(validateRequiredIgnoreRules("!local-example.txt")[0]).toContain(
    ".gitignore must define universal rules for",
  );
  expect(
    validateRequiredIgnoreRules(
      "**/node_modules\n**/.git\n**/coverage\n**/dist\n**/build\n**/generated\n**/artifacts\n**/test-results\n**/.DS_Store\n**/Thumbs.db\n.env*\n!.env.example\n!**/.env.example",
    ),
  ).toEqual([]);
  expect(
    validateRequiredIgnoreRules(
      "**/node_modules/**\n**/.git/**\n**/coverage/**\n**/dist/**\n**/build/**\n**/generated/**\n**/artifacts/**\n**/test-results/**\n**/.DS_Store\n**/Thumbs.db\n.env*\n!.env.example\n!**/.env.example",
    ),
  ).toEqual([]);
  expect(validateRequiredIgnoreRules("coverage/**")[0]).toContain(
    ".gitignore must define universal rules for",
  );
});

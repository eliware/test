import { expect, test } from "@jest/globals";
import { validateCommandList } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/command-lists.mjs";

const prefix = ["git pull", "npm ci", "npm test"];

test("requires an array with the canonical command prefix", () => {
  expect(validateCommandList(prefix)).toEqual([]);
  expect(validateCommandList(true)).toEqual([
    ".knit/deploy.yaml commands field 1 must be an array of strings.",
  ]);
  expect(validateCommandList(["git pull", "npm ci"])).toEqual([
    ".knit/deploy.yaml commands field 1 must contain the full required command prefix.",
  ]);
  expect(validateCommandList(["git pull origin main", "npm ci", "npm test"])).toEqual([
    ".knit/deploy.yaml commands field 1 must begin with git pull, npm ci, npm test.",
  ]);
  expect(validateCommandList(["git pull --ff-only origin main", "npm ci", "npm test"])).toEqual([
    ".knit/deploy.yaml commands field 1 must begin with git pull, npm ci, npm test.",
  ]);
});

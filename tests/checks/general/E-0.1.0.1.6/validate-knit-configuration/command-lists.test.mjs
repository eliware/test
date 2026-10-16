import { expect, test } from "@jest/globals";
import {
  findCommandLists,
  validateCommandList,
} from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/command-lists.mjs";

const prefix = ["git pull --ff-only origin main", "npm ci", "npm test"];

test("finds commands lists recursively", () => {
  expect(findCommandLists({ jobs: [{ commands: prefix }], nested: { commands: [] } })).toEqual([
    prefix,
    [],
  ]);
});

test("requires an array with the canonical command prefix", () => {
  expect(validateCommandList(prefix)).toEqual([]);
  expect(validateCommandList(true)).toEqual([
    ".knit/deploy.yaml commands field 1 must be an array of strings.",
  ]);
  expect(validateCommandList(["git pull --ff-only origin main", "npm ci"])).toEqual([
    ".knit/deploy.yaml commands field 1 must contain the full required command prefix.",
  ]);
  expect(validateCommandList(["git pull origin main", "npm ci", "npm test"])).toEqual([
    ".knit/deploy.yaml commands field 1 must begin with git pull --ff-only origin main, npm ci, npm test.",
  ]);
});

test.each([
  "npm publish",
  "docker push ghcr.io/eliware/app:latest",
  "pnpm publish",
  "npx semantic-release",
])("rejects publish command %s", (command) => {
  expect(validateCommandList([...prefix, command])).toContainEqual(
    ".knit/deploy.yaml commands field 1 must not publish npm packages or GHCR images.",
  );
});

test("allows other extra commands without script paths", () => {
  expect(validateCommandList([...prefix, "npm run validate", "codescope all"])).toEqual([]);
});

test("allows quoted scripts under .knit with the required extension", () => {
  expect(validateCommandList([...prefix, 'node ".knit/scripts/run.mjs"'])).toEqual([]);
});

test.each([
  "node scripts/run.mjs",
  "node .knit/../outside.mjs",
  "node .knit/scripts/run.js",
  "node .knit/scripts/run",
  'node "scripts/run.mjs"',
])("rejects invalid secondary script paths: %s", (command) => {
  expect(validateCommandList([...prefix, command]).join(" ")).toContain(
    "must keep secondary scripts under .knit/ and use .mjs",
  );
});

test("ignores an empty quoted script argument", () => {
  expect(validateCommandList([...prefix, 'node ""'])).toEqual([]);
});

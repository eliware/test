import { expect, test } from "@jest/globals";
import {
  findCommandLists,
  validateCommandList,
} from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/command-lists.mjs";

const prefix = ["git pull", "npm ci", "npm test"];

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

test("allows extra Knit validation through declared package scripts", () => {
  expect(
    validateCommandList([...prefix, "npm run validate"], 0, {
      scripts: { validate: "netdoc --validate" },
    }),
  ).toEqual([]);
  expect(
    validateCommandList([...prefix, "npm run preflight"], 0, {
      scripts: { preflight: "vyops preflight config.boot" },
    }),
  ).toEqual([]);
});

test("rejects direct or undeclared Knit validation commands", () => {
  expect(validateCommandList([...prefix, "codescope all"])).toContain(
    ".knit/deploy.yaml commands field 1 command 4 must call a declared package script with npm run <name>.",
  );
  expect(validateCommandList([...prefix, "npm run validate"], 0, { scripts: {} })).toContain(
    ".knit/deploy.yaml commands field 1 command 4 must name a script declared in package.json.scripts.",
  );
  expect(validateCommandList([...prefix, 'bash -c "node ./config"'])).toContain(
    ".knit/deploy.yaml commands field 1 command 4 must call a declared package script with npm run <name>.",
  );
});

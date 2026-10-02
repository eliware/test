import { expect, test } from "@jest/globals";
import { findValidationCommandPair } from "../../../../../src/checks/general/E-0.1/E-0.1.24/find-validation-command-pair.mjs";

test("finds the required install and test commands", () => {
  const commands = [{ command: "npm ci" }, { command: "npm test" }];
  expect(findValidationCommandPair("ci.yml", commands)).toMatchObject({
    install: commands[0],
    test: commands[1],
  });
  const indexedCommands = [
    { command: "npm ci", index: 4 },
    { command: "npm test", index: 5 },
  ];
  expect(findValidationCommandPair("ci.yml", indexedCommands)).toMatchObject({
    install: indexedCommands[0],
    test: indexedCommands[1],
  });
});

test("rejects missing, interrupted, and reversed required commands", () => {
  expect(findValidationCommandPair("ci.yml", [])).toHaveProperty("error");
  expect(findValidationCommandPair("ci.yml", [{ command: "npm test" }])).toHaveProperty("error");
  expect(findValidationCommandPair("ci.yml", [{ command: "npm ci" }])).toHaveProperty("error");
  expect(
    findValidationCommandPair("ci.yml", [
      { command: "npm ci" },
      { command: "npm ci" },
      { command: "npm test" },
    ]),
  ).toHaveProperty("error");
  expect(
    findValidationCommandPair("ci.yml", [
      { command: "npm ci" },
      { command: "npm test" },
      { command: "npm test" },
    ]),
  ).toHaveProperty("error");
  expect(
    findValidationCommandPair("ci.yml", [
      { command: "npm ci" },
      { command: "npm test" },
      { command: "npm ci" },
    ]),
  ).toHaveProperty("error");
  expect(
    findValidationCommandPair("ci.yml", [{ command: "npm test" }, { command: "npm ci" }]),
  ).toHaveProperty("error");
});

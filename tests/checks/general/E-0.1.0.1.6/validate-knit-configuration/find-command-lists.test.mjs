import { expect, test } from "@jest/globals";
import { findCommandLists } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/find-command-lists.mjs";

test("finds command lists in nested objects and arrays", () => {
  expect(
    findCommandLists({ jobs: [{ commands: ["npm test"] }], nested: { commands: [] } }),
  ).toEqual([["npm test"], []]);
});

test("uses a supplied result list and ignores non-container values", () => {
  const lists = [];
  expect(findCommandLists({ commands: ["npm test"], value: null }, lists)).toBe(lists);
  expect(lists).toEqual([["npm test"]]);
  expect(findCommandLists("not a container")).toEqual([]);
});

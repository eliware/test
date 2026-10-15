import { expect, test } from "@jest/globals";
import { planSourcePrefixMoves } from "../../../../src/checks/general/E-0.1.0.1.10/plan-source-prefix-moves.mjs";

test("groups matching files under a folder named from the full prefix", () => {
  expect(
    planSourcePrefixMoves([
      "src/create-repository-directory-read-cache.mjs",
      "src/create-repository-entry-index.mjs",
    ]),
  ).toEqual([
    {
      from: "src/create-repository-directory-read-cache.mjs",
      to: "src/create-repository/directory-read-cache.mjs",
    },
    { from: "src/create-repository-entry-index.mjs", to: "src/create-repository/entry-index.mjs" },
  ]);
});

test("finds repeated prefixes recursively and keeps only the required child name", () => {
  expect(
    planSourcePrefixMoves([
      "src/maintask-subtaskA-subtask1.mjs",
      "src/maintask-subtaskA-subtask2.mjs",
      "src/maintask-subtaskB.mjs",
    ]),
  ).toEqual([
    { from: "src/maintask-subtaskA-subtask1.mjs", to: "src/maintask/subtaskA/subtask1.mjs" },
    { from: "src/maintask-subtaskA-subtask2.mjs", to: "src/maintask/subtaskA/subtask2.mjs" },
    { from: "src/maintask-subtaskB.mjs", to: "src/maintask/subtaskB.mjs" },
  ]);
});

test("ignores E rule ID prefixes", () => {
  expect(planSourcePrefixMoves(["src/E-0.1.0.1.2.mjs", "src/E-0.1.0.1.3.mjs"])).toEqual([]);
});

test("removes a repeated parent folder name from a single child file", () => {
  expect(planSourcePrefixMoves(["src/task/task-child.mjs"])).toEqual([
    { from: "src/task/task-child.mjs", to: "src/task/child.mjs" },
  ]);
});

test("does not plan test or non-source files", () => {
  expect(
    planSourcePrefixMoves([
      "tests/task-a.test.mjs",
      "tests/task-b.test.mjs",
      "src/task-a.js",
      "src/task-b.js",
      "src/task-c.mjs",
    ]),
  ).toEqual([]);
});

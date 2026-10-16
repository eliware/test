import { expect, test } from "@jest/globals";
import {
  isRelatedPrefix,
  makeTarget,
  repeatedPrefixes,
} from "../../../../../src/checks/general/E-0.1.0.1.10/plan-source-prefix-moves/prefix-group.mjs";

test("finds repeated filename prefixes at every hyphen boundary", () => {
  expect(
    repeatedPrefixes([
      { stem: "maintask-subtaskA-subtask1" },
      { stem: "maintask-subtaskA-subtask2" },
      { stem: "maintask-subtaskB" },
    ]),
  ).toEqual([
    { prefix: "maintask-", count: 3 },
    { prefix: "maintask-subtaskA-", count: 2 },
  ]);
});

test("matches related prefixes and creates a folder from the full prefix", () => {
  expect(isRelatedPrefix("create-", "create-repository-")).toBe(true);
  expect(isRelatedPrefix("read-", "create-repository-")).toBe(false);
  expect(
    makeTarget("src", "create-repository-", {
      stem: "create-repository-entry-index",
      suffix: ".mjs",
    }),
  ).toBe("src/create-repository/entry-index.mjs");
});

import { expect, test } from "@jest/globals";
import { readTocLinks } from "../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/toc-links.mjs";

test("reads inline and reference-style local heading links", () => {
  expect(
    readTocLinks(
      "- [Features](#features)\n- [Setup][setup]\n\n[setup]: <#setup>\n[Features]: #features",
    ),
  ).toEqual([
    ["Features", "features"],
    ["Setup", "setup"],
  ]);
});

test("supports collapsed and shortcut reference links", () => {
  expect(readTocLinks("[Features][]\n[Setup]\n\n[features]: #features\n[setup]: #setup")).toEqual([
    ["Features", "features"],
    ["Setup", "setup"],
  ]);
});

test("normalizes labels and skips definitions and non-local destinations", () => {
  expect(
    readTocLinks(
      "[Read Me][read me]\n[External][external]\n\n[Read Me]: #read-me\n[external]: https://example.com",
    ),
  ).toEqual([["Read Me", "read-me"]]);
});

test("returns no links when the content has no links", () => {
  expect(readTocLinks("Table of contents\n\n[unlinked]: #heading")).toEqual([]);
});

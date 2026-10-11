import { expect, test } from "@jest/globals";
import { groupSpecificationEntries } from "../../../../src/checks/general/E-0.1.0.1.4/group-specification-entries.mjs";

test("groups local files and child directories in one pass", () => {
  const entries = [
    { type: "directory", path: "specs/conventions" },
    { type: "file", path: "specs/directives.yaml" },
    { type: "file", path: "specs/conventions/general.yaml" },
    { type: "unsupported", path: "specs/ignored" },
  ];

  expect(groupSpecificationEntries(entries)).toEqual({
    filesByDirectory: new Map([
      ["specs", [{ type: "file", path: "specs/directives.yaml" }]],
      ["specs/conventions", [{ type: "file", path: "specs/conventions/general.yaml" }]],
    ]),
    childrenByDirectory: new Map([["specs", ["specs/conventions"]]]),
  });
});

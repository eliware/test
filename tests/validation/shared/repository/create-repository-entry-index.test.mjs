import { expect, test } from "@jest/globals";
import { createRepositoryEntryIndex } from "../../../../src/validation/shared/repository/create-repository-entry-index.mjs";

test("indexes child records and records known and pruned directories", () => {
  const readme = { path: "README.md", type: "file" };
  const source = { path: "src", type: "directory" };
  const module = { path: "src/index.mjs", type: "file" };
  const coverage = { path: "coverage", type: "directory" };
  const report = { path: "coverage/summary.json", type: "file" };

  const index = createRepositoryEntryIndex([readme, source, module, coverage, report]);

  expect(index.childrenByDirectory.get(".")).toEqual([readme, source, coverage]);
  expect(index.childrenByDirectory.get("src")).toEqual([module]);
  expect(index.childrenByDirectory.get("coverage")).toEqual([report]);
  expect(index.knownDirectories).toEqual(new Set(["src", "coverage"]));
  expect(index.prunedDirectories).toEqual(new Set(["coverage"]));
});

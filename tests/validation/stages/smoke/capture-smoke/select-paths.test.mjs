import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { selectSmokePaths } from "../../../../../src/validation/stages/smoke/capture-smoke/select-paths.mjs";

test("selects and deduplicates package and binary paths", () => {
  expect(selectSmokePaths("repo", "@eliware/test", ["eliware-test", "eliware-test"])).toEqual([
    join("repo", "package.json"),
    join("repo", "package-lock.json"),
    join("repo", "npm-shrinkwrap.json"),
    join("repo", "node_modules", ".package-lock.json"),
    join("repo", "node_modules", "@eliware", "test"),
    join("repo", "node_modules", ".bin", "eliware-test"),
    join("repo", "node_modules", ".bin", "eliware-test.cmd"),
    join("repo", "node_modules", ".bin", "eliware-test.ps1"),
  ]);
});

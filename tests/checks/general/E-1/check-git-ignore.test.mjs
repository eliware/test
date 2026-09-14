import { expect, test } from "@jest/globals";
import { isIgnoredByGit } from "../../../../src/checks/general/E-1/check-git-ignore.mjs";

test("returns the Git ignore decision", async () => {
  expect(await isIgnoredByGit(process.cwd(), "node_modules/eliware-test")).toBe(true);
  expect(await isIgnoredByGit(process.cwd(), "not-a-real-tracked-file.txt")).toBe(false);
});

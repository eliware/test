import { expect, test } from "@jest/globals";
import { readTrackedPaths } from "../../../../../src/checks/general/E-1/E-1.6/read-tracked-paths.mjs";

test("returns null when Git cannot inspect the target", async () => {
  await expect(readTrackedPaths("C:/path-that-does-not-exist")).resolves.toBeNull();
});

test("reads tracked paths from a repository using the resolved Git executable", async () => {
  await expect(readTrackedPaths(process.cwd())).resolves.toContain("package.json");
});

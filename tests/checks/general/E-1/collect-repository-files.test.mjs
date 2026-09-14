import { expect, test } from "@jest/globals";
import { collectRepositoryFiles } from "../../../../src/checks/general/E-1/collect-repository-files.mjs";

test("collects files recursively and ignores special entries", async () => {
  await expect(collectRepositoryFiles("C:/root", "C:/root", async () => [
    { name: "module.mjs", isDirectory: () => false, isFile: () => true },
    { name: "special", isDirectory: () => false, isFile: () => false },
  ])).resolves.toEqual(["module.mjs"]);
});

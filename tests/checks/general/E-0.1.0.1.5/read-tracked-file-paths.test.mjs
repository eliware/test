import { expect, test } from "@jest/globals";
import { readTrackedFilePaths } from "../../../../src/checks/general/E-0.1.0.1.5/read-tracked-file-paths.mjs";

test("parses NUL-delimited Buffer output from Git", async () => {
  await expect(
    readTrackedFilePaths("repo-root", async () => ({
      stdout: Buffer.from("README.md\0src/index.mjs\0"),
    })),
  ).resolves.toEqual(new Set(["README.md", "src/index.mjs"]));
});

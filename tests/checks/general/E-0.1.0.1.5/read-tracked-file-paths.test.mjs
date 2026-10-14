import { expect, jest, test } from "@jest/globals";
import { readTrackedFilePaths } from "../../../../src/checks/general/E-0.1.0.1.5/read-tracked-file-paths.mjs";

test("lists tracked paths with a mocked Git call", async () => {
  const runGit = jest.fn(async () => ({ stdout: Buffer.from("README.md\0src/index.mjs\0") }));

  await expect(readTrackedFilePaths("repo-root", runGit)).resolves.toEqual(
    new Set(["README.md", "src/index.mjs"]),
  );
  expect(runGit).toHaveBeenCalledWith("git", ["-C", "repo-root", "ls-files", "--cached", "-z"], {
    windowsHide: true,
    encoding: "buffer",
  });
});

test("accepts string output from the Git adapter", async () => {
  await expect(
    readTrackedFilePaths("repo-root", async () => ({ stdout: "README.md\0" })),
  ).resolves.toEqual(new Set(["README.md"]));
});

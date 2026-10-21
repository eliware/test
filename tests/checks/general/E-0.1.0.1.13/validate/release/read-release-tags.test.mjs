import { expect, jest, test } from "@jest/globals";
import { readReleaseTags } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/read-release-tags.mjs";

test("reads tags only after confirming the repository has complete history", async () => {
  const runGit = jest
    .fn()
    .mockResolvedValueOnce({ stdout: "false" })
    .mockResolvedValueOnce({ stdout: "v1.0.0\nv2.0.0\n" });
  await expect(readReleaseTags("repo", runGit)).resolves.toEqual({
    tags: new Set(["v1.0.0", "v2.0.0", ""]),
  });
  expect(runGit).toHaveBeenCalledTimes(2);
});

test("rejects a shallow repository without reading tags", async () => {
  const runGit = jest.fn().mockResolvedValue({ stdout: "true" });
  await expect(readReleaseTags("repo", runGit)).resolves.toEqual({
    error: "Full Git tag history is required for release-note validation.",
  });
  expect(runGit).toHaveBeenCalledTimes(1);
});

test("reports Git read failures", async () => {
  await expect(
    readReleaseTags("repo", async () => {
      throw new Error("failed");
    }),
  ).resolves.toEqual({
    error: "Repository tags could not be read for release-note validation.",
  });
});

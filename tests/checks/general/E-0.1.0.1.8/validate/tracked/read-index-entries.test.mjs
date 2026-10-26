import { expect, jest, test } from "@jest/globals";
import { readTrackedIndexEntries } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/read-index-entries.mjs";

test("reads and parses cached Git index entries with binary output", async () => {
  const stdout = Buffer.from(`100644 ${"a".repeat(40)} 0\tsrc/index.mjs\0`);
  const runGit = jest.fn().mockResolvedValue({ stdout });
  await expect(readTrackedIndexEntries("repo", runGit)).resolves.toEqual([
    { mode: "100644", path: "src/index.mjs" },
  ]);
  expect(runGit).toHaveBeenCalledWith(
    "git",
    ["-C", "repo", "ls-files", "--cached", "--stage", "-z"],
    { windowsHide: true, encoding: "buffer" },
  );
});

test("reports malformed Git index entries to the caller", async () => {
  await expect(
    readTrackedIndexEntries("repo", async () => ({ stdout: Buffer.from("bad\0") })),
  ).rejects.toThrow("Git returned an invalid index entry.");
});

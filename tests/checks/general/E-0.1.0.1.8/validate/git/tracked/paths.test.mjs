import { expect, test } from "@jest/globals";
import validateTrackedPaths from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/tracked/paths.mjs";
const entry = (mode, path) => `${mode} ${"a".repeat(40)} 0\t${path}\0`;
test("collects tracked-path validation errors", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("--ignored")) return { stdout: Buffer.from("ignored.env\0") };
    return {
      stdout: Buffer.from(entry("120000", "link") + entry("100644", "config/secrets/token.json")),
    };
  };
  await expect(validateTrackedPaths("repo", runGit)).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("Tracked or staged paths match ignore rules"),
      expect.stringContaining("Tracked symlink entries are prohibited"),
      expect.stringContaining("Tracked sensitive paths are prohibited"),
    ]),
  );
});
test("accepts a tracked index without prohibited paths", async () => {
  await expect(
    validateTrackedPaths("repo", async () => ({ stdout: Buffer.from("") })),
  ).resolves.toEqual([]);
});

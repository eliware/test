import { expect, test } from "@jest/globals";
import { validateTrackedPaths } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/tracked-paths.mjs";

const gitIndex = (mode, path) => Buffer.from(`${mode} ${"a".repeat(40)} 0\t${path}\0`);

test("accepts a tracked index without prohibited paths", async () => {
  await expect(
    validateTrackedPaths("repo", async () => ({ stdout: Buffer.from("") })),
  ).resolves.toEqual([]);
});

test("collects ignored, symlink, and sensitive tracked path findings", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("--ignored")) return { stdout: Buffer.from("ignored.txt\0") };
    return {
      stdout: Buffer.concat([
        gitIndex("120000", "link"),
        gitIndex("100644", "config/secrets/token.json"),
      ]),
    };
  };

  await expect(validateTrackedPaths("repo", runGit)).resolves.toEqual([
    "Tracked or staged paths match ignore rules: ignored.txt.",
    "Tracked symlink entries are prohibited: link.",
    "Tracked sensitive paths are prohibited: config/secrets/token.json.",
  ]);
});

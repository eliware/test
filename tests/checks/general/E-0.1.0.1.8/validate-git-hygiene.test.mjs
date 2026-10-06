import { expect, test } from "@jest/globals";
import { validateGitHygiene } from "../../../../src/checks/general/E-0.1.0.1.8/validate-git-hygiene.mjs";

test("accepts required ignore rules and clean index records", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) {
      if (args.at(-1).endsWith(".example"))
        throw Object.assign(new Error("not ignored"), { code: 1 });
      return { code: 0 };
    }
    return { stdout: Buffer.from("") };
  };
  await expect(validateGitHygiene("repo", runGit)).resolves.toEqual([]);
});

test("reports index failures and tracked links", async () => {
  let call = 0;
  const runGit = async (_command, args) => {
    call += 1;
    if (args.includes("check-ignore")) return { code: args.at(-1).endsWith(".example") ? 1 : 0 };
    if (args.includes("--ignored")) throw new Error("index unavailable");
    return { stdout: Buffer.from("120000 object 0\tlink\0") };
  };
  const errors = await validateGitHygiene("repo", runGit);
  expect(call).toBeGreaterThan(14);
  expect(errors).toContain("Git index status could not be read; tracked ignore status is unknown.");
  expect(errors).toContain("Tracked symlink entries are prohibited: link.");
});

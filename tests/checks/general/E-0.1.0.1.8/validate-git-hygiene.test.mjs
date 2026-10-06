import { expect, test } from "@jest/globals";
import { validateGitHygiene } from "../../../../src/checks/general/E-0.1.0.1.8/validate-git-hygiene.mjs";

const ignoreRules = `node_modules/
.git/
coverage/
dist/
build/
generated/
artifacts/
test-results/
.env*
!.env*.example
.DS_Store
Thumbs.db`;

test("accepts required ignore rules and clean index records", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) {
      if (args.at(-1).endsWith(".example"))
        throw Object.assign(new Error("not ignored"), { code: 1 });
      return { code: 0 };
    }
    return { stdout: Buffer.from("") };
  };
  await expect(
    validateGitHygiene("repo", runGit, { readText: async () => ignoreRules }),
  ).resolves.toEqual([]);
});

test("reports index failures and tracked links", async () => {
  let call = 0;
  const runGit = async (_command, args) => {
    call += 1;
    if (args.includes("check-ignore")) return { code: args.at(-1).endsWith(".example") ? 1 : 0 };
    if (args.includes("--ignored")) throw new Error("index unavailable");
    return { stdout: Buffer.from("120000 object 0\tlink\0") };
  };
  const errors = await validateGitHygiene("repo", runGit, { readText: async () => ignoreRules });
  expect(call).toBeGreaterThan(14);
  expect(errors).toContain("Git index status could not be read; tracked ignore status is unknown.");
  expect(errors).toContain("Tracked symlink entries are prohibited: link.");
});

test("checks deep generated paths and production environment files", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) {
      const path = args.at(-1);
      if (path === "nested/deep/layer/four/.env.production")
        throw Object.assign(new Error("not ignored"), { code: 1 });
      return args.at(-1).endsWith(".example")
        ? Promise.reject(Object.assign(new Error("not ignored"), { code: 1 }))
        : { code: 0 };
    }
    return { stdout: Buffer.from("") };
  };
  await expect(
    validateGitHygiene("repo", runGit, { readText: async () => ignoreRules }),
  ).resolves.toContain("nested/deep/layer/four/.env.production must be ignored.");
});

test("requires universal repository ignore patterns", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore"))
      return args.at(-1).endsWith(".example") ? { code: 1 } : { code: 0 };
    return { stdout: Buffer.from("") };
  };
  const errors = await validateGitHygiene("repo", runGit, {
    readText: async () =>
      "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\ngenerated/\nartifacts/\ntest-results/\n.env*\n!.env*.example\n!.env.production\n.DS_Store\nThumbs.db",
  });
  expect(errors).toContain(
    ".gitignore must define universal rules for: unsafe negations: !.env.production.",
  );
});

test("reports an unreadable ignore file", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore"))
      return args.at(-1).endsWith(".example") ? { code: 1 } : { code: 0 };
    return { stdout: Buffer.from("") };
  };
  const errors = await validateGitHygiene("repo", runGit, {
    readText: async () => {
      throw new Error("read denied");
    },
  });
  expect(errors).toContain(".gitignore could not be read to check required ignore rules.");
});

test("reads the repository ignore file by default", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore"))
      return args.at(-1).endsWith(".example") ? { code: 1 } : { code: 0 };
    return { stdout: Buffer.from("") };
  };
  await expect(validateGitHygiene(process.cwd(), runGit)).resolves.toEqual([]);
});

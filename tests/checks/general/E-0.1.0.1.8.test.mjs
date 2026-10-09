import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.8.mjs";
import { validateGitHygiene } from "../../../src/checks/general/E-0.1.0.1.8/validate-git-hygiene.mjs";

const ignoreText = `node_modules/\n.git/\ncoverage/\ndist/\nbuild/\ngenerated/\nartifacts/\ntest-results/\n.env*\n!.env*.example\n.DS_Store\nThumbs.db`;

function createGitRunner({ symlinks = [], trackedIgnored = [], failAt } = {}) {
  let index = 0;
  return async (_command, args) => {
    const current = index++;
    if (current === failAt) throw Object.assign(new Error("git failed"), { code: 2 });
    if (args.includes("check-ignore")) {
      const path = args.at(-1);
      const shouldIgnore = !path.endsWith(".example");
      if (shouldIgnore) return { code: 0, stdout: "", stderr: "" };
      throw Object.assign(new Error("not ignored"), { code: 1 });
    }
    if (args.includes("--ignored"))
      return {
        stdout: Buffer.from(`${trackedIgnored.join("\0")}${trackedIgnored.length ? "\0" : ""}`),
      };
    return {
      stdout: Buffer.from(symlinks.map((path) => `120000 ${"a".repeat(40)} 0\t${path}`).join("\0")),
    };
  };
}

test("accepts required ignore rules and a clean Git index", async () => {
  await expect(
    validateGitHygiene("repo", createGitRunner(), { readText: async () => ignoreText }),
  ).resolves.toEqual([]);
});

test("runs with injected Git and file dependencies", async () => {
  await expect(
    run({ root: "repo", runGit: createGitRunner(), readText: async () => ignoreText }),
  ).resolves.toMatchObject({ ruleId, status: "pass" });
});

test("uses injected dependencies when the check context is omitted", async () => {
  await expect(
    run(undefined, { runGit: createGitRunner(), readText: async () => ignoreText }),
  ).resolves.toMatchObject({ ruleId, status: "pass" });
});

test("reports missing ignore rules, ignored tracked files, and symlinks", async () => {
  const runner = async (_command, args) => {
    if (args.includes("check-ignore")) throw Object.assign(new Error("not ignored"), { code: 1 });
    if (args.includes("--ignored")) return { stdout: Buffer.from("tracked.env\0") };
    return { stdout: Buffer.from(`120000 ${"a".repeat(40)} 0\tlink\0`) };
  };
  const result = await run({ root: "repo", runGit: runner, readText: async () => ignoreText });
  expect(result.ruleId).toBe(ruleId);
  expect(result.status).toBe("fail");
  expect(result.message).toContain("must be ignored");
  expect(result.message).toContain("Tracked or staged paths");
  expect(result.message).toContain("Tracked symlink entries");
});

test("reports Git status errors", async () => {
  const result = await run({
    root: "repo",
    runGit: createGitRunner({ failAt: 0 }),
    readText: async () => ignoreText,
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Git ignore rules could not be inspected");
  const indexResult = await run({
    root: "repo",
    runGit: createGitRunner({ failAt: 60 }),
    readText: async () => ignoreText,
  });
  expect(indexResult.message).toContain("Git index status could not be read");
  const linkIndex = await validateGitHygiene("repo", createGitRunner({ failAt: 61 }), {
    readText: async () => ignoreText,
  });
  expect(linkIndex).toContain("Git index status could not be read; tracked symlinks are unknown.");
});

test("reports a tracked ignored path", async () => {
  await expect(
    validateGitHygiene("repo", createGitRunner({ trackedIgnored: ["ignored.txt"] }), {
      readText: async () => ignoreText,
    }),
  ).resolves.toContain("Tracked or staged paths match ignore rules: ignored.txt.");
});

test("rejects malformed Git path and index output", async () => {
  const indexRunner = async (_command, args) =>
    args.includes("--stage")
      ? { stdout: Buffer.from("120000 invalid 0\tlink\0") }
      : args.includes("--ignored")
        ? { stdout: Buffer.from("/absolute/path\0") }
        : { code: 0, stdout: "" };
  const errors = await validateGitHygiene("repo", indexRunner, {
    readText: async () => ignoreText,
  });
  expect(errors).toContain("Git index status could not be read; tracked ignore status is unknown.");
  expect(errors).toContain("Git index status could not be read; tracked symlinks are unknown.");
});

test("uses the current directory and detects an ignored example file", async () => {
  const runner = async (_command, args) => {
    if (args.includes("check-ignore")) return { code: 0 };
    return { stdout: Buffer.from("") };
  };
  await expect(run({ runGit: runner, readText: async () => ignoreText })).resolves.toMatchObject({
    message: expect.stringContaining("must not be ignored"),
  });
});

test("reports failure when Git treats an example file as ignored", async () => {
  const runner = async (_command, args) => {
    if (args.includes("check-ignore")) return { code: 0 };
    return { stdout: Buffer.from("") };
  };
  await expect(
    validateGitHygiene("repo", runner, { readText: async () => ignoreText }),
  ).resolves.toContain("nested/.env.production.example must not be ignored.");
});

test("handles Git ignore command codes and missing Git", async () => {
  const failedIgnore = async (_command, args) => {
    if (args.includes("check-ignore")) {
      if (args.at(-1) === "nested/node_modules/item.txt") return { code: 1 };
      if (args.at(-1) === "nested/.git/item.txt")
        throw Object.assign(new Error("missing"), { code: "ENOENT" });
      if (args.at(-1).endsWith(".example"))
        throw Object.assign(new Error("not ignored"), { code: 1 });
      return { code: 0 };
    }
    return { stdout: Buffer.from("") };
  };
  const errors = await validateGitHygiene("repo", failedIgnore, {
    readText: async () => ignoreText,
  });
  expect(errors).toContain("nested/node_modules/item.txt must be ignored.");
  expect(errors).toContain("Git ignore rules could not be inspected for nested/.git/item.txt.");
});

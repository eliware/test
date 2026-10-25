import { expect, test } from "@jest/globals";
import { requiredIgnoreCases } from "../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns.mjs";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.8.mjs";

const ignoreText = `node_modules/\n.git/\ncoverage/\ndist/\nbuild/\ngenerated/\nartifacts/\ntest-results/\n.DS_Store\nThumbs.db`;

function createGitRunner({ symlinks = [], trackedIgnored = [], failAt } = {}) {
  let index = 0;
  return async (_command, args) => {
    const current = index++;
    if (current === failAt) throw Object.assign(new Error("git failed"), { code: 2 });
    if (args.includes("check-ignore"))
      return {
        code: 0,
        stdout: Buffer.from(
          requiredIgnoreCases
            .filter(([, shouldIgnore]) => shouldIgnore)
            .map(([path]) => {
              const parts = path.split("/");
              const pattern = parts.at(-1) === "item.txt" ? parts.at(-2) : parts.at(-1);
              return `.gitignore:1:${pattern}\t${path}`;
            })
            .join("\n"),
        ),
      };
    if (args.includes("--ignored"))
      return {
        stdout: Buffer.from(`${trackedIgnored.join("\0")}${trackedIgnored.length ? "\0" : ""}`),
      };
    return {
      stdout: Buffer.from(symlinks.map((path) => `120000 ${"a".repeat(40)} 0\t${path}`).join("\0")),
    };
  };
}

test("uses injected dependencies when the check context is omitted", async () => {
  await expect(
    run(undefined, { runGit: createGitRunner(), readText: async () => ignoreText }),
  ).resolves.toMatchObject({ ruleId, status: "pass" });
});

test("reports missing ignore rules, ignored tracked files, and symlinks", async () => {
  const runner = async (_command, args) => {
    if (args.includes("check-ignore")) throw Object.assign(new Error("not ignored"), { code: 1 });
    if (args.includes("--ignored")) return { stdout: Buffer.from("tracked-output.log\0") };
    return { stdout: Buffer.from(`120000 ${"a".repeat(40)} 0\tlink\0`) };
  };
  const result = await run({ root: "repo", runGit: runner, readText: async () => ignoreText });
  expect(result.ruleId).toBe(ruleId);
  expect(result.status).toBe("fail");
  expect(result.message).toContain("must be ignored");
  expect(result.message).toContain("Tracked or staged paths");
  expect(result.message).toContain("Tracked symlink entries");
});

test("rejects tracked credential paths through the complete rule", async () => {
  const runner = async (_command, args) => {
    if (args.includes("check-ignore")) return { code: 0 };
    if (args.includes("--stage"))
      return { stdout: Buffer.from(`100644 ${"a".repeat(40)} 0\tconfig/credentials\0`) };
    return { stdout: Buffer.from("") };
  };
  const result = await run({ root: "repo", runGit: runner, readText: async () => ignoreText });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Tracked sensitive paths are prohibited: config/credentials.");
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
    runGit: createGitRunner({ failAt: 4 }),
    readText: async () => ignoreText,
  });
  expect(indexResult.message).toContain("Git index status could not be read");
});

test("uses injected dependencies from the current directory to check required ignored paths", async () => {
  const roots = [];
  const runner = async (_command, args) => {
    roots.push(args[1]);
    if (args.includes("check-ignore"))
      return {
        code: 0,
        stdout: requiredIgnoreCases
          .filter(([, shouldIgnore]) => shouldIgnore)
          .map(([path]) => {
            const parts = path.split("/");
            const pattern = parts.at(-1) === "item.txt" ? parts.at(-2) : parts.at(-1);
            return `.gitignore:1:${pattern}\t${path}`;
          })
          .join("\n"),
      };
    return { stdout: Buffer.from("") };
  };
  const readPaths = [];
  const result = await run({
    runGit: runner,
    readText: async (path) => {
      readPaths.push(path);
      return ignoreText;
    },
  });
  expect(result).toMatchObject({ ruleId, status: "pass" });
  expect(roots.every((root) => root === process.cwd())).toBe(true);
  expect(readPaths).toEqual([`${process.cwd()}/.gitignore`]);
});

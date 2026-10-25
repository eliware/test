import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const getFileInfo = jest.fn();
const prettier = await import("prettier");

jest.unstable_mockModule("prettier", () => ({
  default: { ...prettier.default, getFileInfo },
}));

const { validatePrettierIgnorePolicy } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.5/validate/prettier/ignore-policy.mjs");

beforeEach(() => getFileInfo.mockReset());

test("rejects .prettierignore files at every directory level", async () => {
  await expect(
    validatePrettierIgnorePolicy({ files: jest.fn() }, [
      ".prettierignore",
      "nested/.prettierignore",
    ]),
  ).resolves.toEqual([
    "Prettier ignore files are not allowed: .prettierignore, nested/.prettierignore.",
  ]);
});

test("skips Git ignore checks when text cannot be read or the file is absent", async () => {
  await expect(validatePrettierIgnorePolicy({}, [".gitignore", "src/index.mjs"])).resolves.toEqual(
    [],
  );
  await expect(
    validatePrettierIgnorePolicy({ readText: jest.fn() }, ["src/index.mjs"]),
  ).resolves.toEqual([]);
});

test("matches Git ignore patterns and exceptions for maintained files", async () => {
  await expect(
    validatePrettierIgnorePolicy(
      {
        readText: async () => "*.mjs\n!src/index.mjs\ndocs/\n# ignored comment",
      },
      [".gitignore", "src/index.mjs", "lib/other.mjs", "docs/guide.md", "assets/image.png"],
    ),
  ).resolves.toEqual([
    ".gitignore must not exclude maintained files: lib/other.mjs, docs/guide.md.",
  ]);
});

test("uses Prettier ignore semantics for tracked files", async () => {
  getFileInfo.mockResolvedValue({ ignored: true });
  const runGit = jest.fn(async () => ({ stdout: Buffer.from("nested/deep/entry.mjs\0") }));
  await expect(
    validatePrettierIgnorePolicy(
      { readText: async () => "*.mjs\n" },
      [".gitignore", "nested/deep/entry.mjs"],
      "C:/repo",
      runGit,
    ),
  ).resolves.toContain(".gitignore must not exclude maintained files: nested/deep/entry.mjs.");
  expect(getFileInfo).toHaveBeenCalledWith(join("C:/repo", "nested/deep/entry.mjs"), {
    ignorePath: [join("C:/repo", ".gitignore")],
  });
  expect(runGit).toHaveBeenCalledWith("git", ["-C", "C:/repo", "ls-files", "--cached", "-z"], {
    windowsHide: true,
    encoding: "buffer",
  });
});

test("accepts string output from the Git tracked-file adapter", async () => {
  getFileInfo.mockResolvedValue({ ignored: true });
  await expect(
    validatePrettierIgnorePolicy(
      { readText: async () => "*.mjs\n" },
      [".gitignore", "src/index.mjs"],
      "C:/repo",
      async () => ({ stdout: "src/index.mjs\0" }),
    ),
  ).resolves.toContain(".gitignore must not exclude maintained files: src/index.mjs.");
});

test("ignores untracked files and maintained files that Prettier accepts", async () => {
  await expect(
    validatePrettierIgnorePolicy(
      {
        readText: async () => "repos/targets.yaml\n",
      },
      [".gitignore", "repos/targets.yaml"],
      "C:/repo",
      async () => ({ stdout: Buffer.alloc(0) }),
    ),
  ).resolves.toEqual([]);
  getFileInfo.mockResolvedValue({ ignored: false });
  await expect(
    validatePrettierIgnorePolicy(
      { readText: async () => "*.tmp\n" },
      [".gitignore", "src/entry.mjs"],
      "C:/repo",
      async () => ({ stdout: Buffer.from("src/entry.mjs\0") }),
    ),
  ).resolves.toEqual([]);
  expect(getFileInfo).not.toHaveBeenCalledWith(join("C:/repo", "repos/targets.yaml"), {
    ignorePath: [join("C:/repo", ".gitignore")],
  });
});

test("reports a tracked maintained YAML file ignored by Git", async () => {
  getFileInfo.mockResolvedValue({ ignored: true });
  await expect(
    validatePrettierIgnorePolicy(
      { readText: async () => "specs/*.yaml\n" },
      [".gitignore", "specs/rules.yaml"],
      "C:/repo",
      async () => ({ stdout: Buffer.from("specs/rules.yaml\0") }),
    ),
  ).resolves.toContain(".gitignore must not exclude maintained files: specs/rules.yaml.");
});

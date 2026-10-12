import { expect, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { validateEntrypointTargets } from "../../../../src/checks/application/E-0.1.4.1.1/validate-entrypoint-targets.mjs";

const file = { isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false };
const directory = { isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false };
const checkPath = async (path) => (path.endsWith(join("bin")) ? directory : file);

test("accepts canonical entrypoint files and a leading dot segment", async () => {
  await expect(validateEntrypointTargets(["./bin/tool.mjs"], "repo", checkPath)).resolves.toEqual(
    [],
  );
});

test("accepts Windows separators after canonical path normalization", async () => {
  const checked = [];
  await expect(
    validateEntrypointTargets(["bin\\tool.mjs"], "repo", async (path) => {
      checked.push(path);
      return path.endsWith(join("bin", "tool.mjs")) ? file : directory;
    }),
  ).resolves.toEqual([]);
  expect(checked.at(-1)).toBe(join(resolve("repo"), "bin", "tool.mjs"));
});

test.each([null, "", " ", "/repo/bin/tool.mjs", "C:/repo/bin/tool.mjs"])(
  "rejects invalid or absolute targets: %s",
  async (target) => {
    await expect(validateEntrypointTargets([target], "repo", async () => file)).resolves.toEqual([
      `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`,
    ]);
  },
);

test.each(["src/tool.mjs", "bin/../tool.mjs", "bin//tool.mjs", "bin/C:/tool.mjs"])(
  "rejects noncanonical target paths: %s",
  async (target) => {
    await expect(validateEntrypointTargets([target], "repo", async () => file)).resolves.toEqual([
      `Entrypoint target must use a canonical path under bin/: ${target}.`,
    ]);
  },
);

test("rejects a symlink in any target path segment", async () => {
  await expect(
    validateEntrypointTargets(["bin/link/tool.mjs"], "repo", async (path) =>
      path === resolve("repo") ? directory : { ...file, isSymbolicLink: () => true },
    ),
  ).resolves.toEqual(["Entrypoint target path must not contain a symlink: bin/link/tool.mjs."]);
});

test("rejects a repository root that is a symlink", async () => {
  await expect(
    validateEntrypointTargets(["bin/tool.mjs"], "repo", async (path) =>
      path === resolve("repo") ? { ...directory, isSymbolicLink: () => true } : file,
    ),
  ).resolves.toEqual(["Entrypoint target path must not contain a symlink: bin/tool.mjs."]);
});

test("requires the target to be a file and reports missing path errors", async () => {
  await expect(
    validateEntrypointTargets(["bin/tool.mjs"], "repo", async (path) =>
      path.endsWith(join("bin")) ? directory : { ...file, isFile: () => false },
    ),
  ).resolves.toEqual(["Entrypoint target must be an existing file: bin/tool.mjs."]);
  await expect(
    validateEntrypointTargets(["bin/missing.mjs"], "repo", async () => {
      throw new Error("missing");
    }),
  ).resolves.toEqual(["Entrypoint target does not exist: bin/missing.mjs."]);
});

test("rejects a file in an intermediate target path", async () => {
  await expect(
    validateEntrypointTargets(["bin/tool.mjs"], "repo", async () => file),
  ).resolves.toEqual(["Entrypoint target path segment must be a directory: bin/tool.mjs."]);
});

test("uses the default filesystem check", async () => {
  await expect(validateEntrypointTargets([], "repo")).resolves.toEqual([]);
});

test("anchors a relative root before checking target paths", async () => {
  let checkedPath;
  await validateEntrypointTargets(["bin/tool.mjs"], "relative-repo", async (path) => {
    checkedPath = path;
    return path.endsWith(join("bin")) ? directory : file;
  });

  expect(checkedPath).toBe(join(resolve("relative-repo"), "bin", "tool.mjs"));
});

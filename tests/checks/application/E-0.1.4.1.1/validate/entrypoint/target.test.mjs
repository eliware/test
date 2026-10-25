import { expect, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { validateEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target.mjs";

const file = { isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false };
const directory = { isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false };

test("normalizes slash forms to one canonical target", async () => {
  const paths = [];
  for (const target of ["./bin/tool.mjs", "bin\\tool.mjs"]) {
    await expect(
      validateEntrypointTarget(target, "repo", async (path) => {
        paths.push(path);
        return path.endsWith(join("bin", "tool.mjs")) ? file : directory;
      }),
    ).resolves.toBeNull();
  }
  expect(paths.at(-1)).toBe(join(resolve("repo"), "bin", "tool.mjs"));
});

test.each([null, "", " ", "/repo/bin/tool.mjs", "C:/repo/bin/tool.mjs"])(
  "rejects invalid or absolute target %s",
  async (target) => {
    await expect(validateEntrypointTarget(target, "repo", async () => file)).resolves.toBe(
      `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`,
    );
  },
);

test.each([
  "src/tool.mjs",
  "bin/../tool.mjs",
  "bin/./tool.mjs",
  "bin//tool.mjs",
  "bin/C:/tool.mjs",
])("rejects noncanonical target %s", async (target) => {
  await expect(validateEntrypointTarget(target, "repo", async () => file)).resolves.toBe(
    `Entrypoint target must use a canonical path under bin/: ${target}.`,
  );
});

test("rejects symlinks in the repository root and target segments", async () => {
  await expect(
    validateEntrypointTarget("bin/link/tool.mjs", "repo", async (path) =>
      path === resolve("repo") ? directory : { ...file, isSymbolicLink: () => true },
    ),
  ).resolves.toContain("must not contain a symlink");
  await expect(
    validateEntrypointTarget("bin/tool.mjs", "repo", async (path) =>
      path === resolve("repo") ? { ...directory, isSymbolicLink: () => true } : file,
    ),
  ).resolves.toContain("must not contain a symlink");
});

test("requires directory segments and an existing file target", async () => {
  await expect(
    validateEntrypointTarget("bin/tool.mjs", "repo", async () => file),
  ).resolves.toContain("path segment must be a directory");
  await expect(
    validateEntrypointTarget("bin/tool.mjs", "repo", async (path) =>
      path.endsWith(join("bin")) ? directory : { ...file, isFile: () => false },
    ),
  ).resolves.toContain("must be an existing file");
});

test("reports missing paths and anchors a relative root", async () => {
  await expect(
    validateEntrypointTarget("bin/missing.mjs", "repo", async () => {
      throw new Error("missing");
    }),
  ).resolves.toContain("target does not exist");
  let checkedPath;
  await validateEntrypointTarget("bin/tool.mjs", "relative-repo", async (path) => {
    checkedPath = path;
    return path.endsWith(join("bin")) ? directory : file;
  });
  expect(checkedPath).toBe(join(resolve("relative-repo"), "bin", "tool.mjs"));
});

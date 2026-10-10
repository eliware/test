import { expect, test } from "@jest/globals";
import { validateEntrypointTargets } from "../../../../src/checks/application/E-0.1.4.1.1/validate-entrypoint-targets.mjs";

const file = { isFile: () => true, isSymbolicLink: () => false };

test("accepts canonical entrypoint files and a leading dot segment", async () => {
  await expect(
    validateEntrypointTargets(["./bin/tool.mjs"], "repo", async () => file),
  ).resolves.toEqual([]);
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
    validateEntrypointTargets(["bin/link/tool.mjs"], "repo", async () => ({
      ...file,
      isSymbolicLink: () => true,
    })),
  ).resolves.toEqual(["Entrypoint target path must not contain a symlink: bin/link/tool.mjs."]);
});

test("requires the target to be a file and reports missing path errors", async () => {
  await expect(
    validateEntrypointTargets(["bin/tool.mjs"], "repo", async () => ({
      isFile: () => false,
      isSymbolicLink: () => false,
    })),
  ).resolves.toEqual(["Entrypoint target must be an existing file: bin/tool.mjs."]);
  await expect(
    validateEntrypointTargets(["bin/missing.mjs"], "repo", async () => {
      throw new Error("missing");
    }),
  ).resolves.toEqual(["Entrypoint target does not exist: bin/missing.mjs."]);
});

test("uses the default filesystem check", async () => {
  await expect(validateEntrypointTargets([], "repo")).resolves.toEqual([]);
});

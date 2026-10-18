import { expect, test } from "@jest/globals";
import { validateApplicationEntrypoints } from "../../../../../src/checks/application/E-0.1.4.1.1/validate/application-entrypoints.mjs";

test("accepts valid entrypoint metadata and targets", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: { bin: "bin/tool.mjs", scripts: { start: "node bin/tool.mjs" } },
    },
    {
      lstat: async (path) => ({
        isFile: () => !path.endsWith("bin"),
        isDirectory: () => path.endsWith("bin"),
        isSymbolicLink: () => false,
      }),
    },
  );
  expect(errors).toEqual([]);
});

test("accepts repositories without entrypoints", async () => {
  await expect(validateApplicationEntrypoints({ packageJson: {} })).resolves.toEqual([]);
  await expect(validateApplicationEntrypoints()).resolves.toEqual([]);
});

test("rejects escaping paths, invalid command names, missing targets, and unmatched start tokens", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: {
        bin: { "bad name": "../app.mjs", tool: "bin/missing.mjs" },
        main: "src/app.mjs",
        scripts: { start: "node app" },
      },
    },
    {
      lstat: async (path) => ({
        isFile: () => path.endsWith("src/app.mjs"),
        isDirectory: () => path.endsWith("bin"),
        isSymbolicLink: () => false,
      }),
    },
  );
  expect(errors).toContain("package.json bin command name is invalid: bad name.");
  expect(errors).toContain("Entrypoint target must use a canonical path under bin/: ../app.mjs.");
  expect(errors).toContain("Entrypoint target must be an existing file: bin/missing.mjs.");
  expect(errors).toContain(
    "package.json start must contain a standalone token for a declared entrypoint.",
  );
});

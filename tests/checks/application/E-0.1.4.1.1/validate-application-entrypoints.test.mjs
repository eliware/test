import { expect, test } from "@jest/globals";
import { validateApplicationEntrypoints } from "../../../../src/checks/application/E-0.1.4.1.1/validate-application-entrypoints.mjs";

test("combines metadata, target, and start-command diagnostics", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: { bin: { "bad name": "bin/tool.mjs" }, scripts: { start: "node app.mjs" } },
    },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
  );
  expect(errors).toContain("package.json bin command name is invalid: bad name.");
  expect(errors).toContain(
    "package.json start must contain a standalone token for a declared entrypoint.",
  );
});

test("accepts valid entrypoint metadata and targets", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: { bin: "bin/tool.mjs", scripts: { start: "node bin/tool.mjs" } },
    },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
  );
  expect(errors).toEqual([]);
});

test("accepts repositories without entrypoints", async () => {
  await expect(validateApplicationEntrypoints({ packageJson: {} })).resolves.toEqual([]);
  await expect(validateApplicationEntrypoints()).resolves.toEqual([]);
});

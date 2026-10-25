import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target.mjs";

test.each([
  [null, "nonempty repository-relative path"],
  ["", "nonempty repository-relative path"],
  ["/repo/bin/tool.mjs", "nonempty repository-relative path"],
  ["src/tool.mjs", "canonical path"],
  ["bin/../tool.mjs", "canonical path"],
])("rejects invalid target %s before checking the file system", async (target, message) => {
  const inspectFilesystem = jest.fn();
  await expect(
    validateEntrypointTarget(target, "repo", undefined, inspectFilesystem),
  ).resolves.toContain(message);
  expect(inspectFilesystem).not.toHaveBeenCalled();
});

test.each([
  ["symlink", "must not contain a symlink"],
  ["directory", "path segment must be a directory"],
  ["file", "must be an existing file"],
  ["missing", "target does not exist"],
])("reports the %s filesystem result", async (result, message) => {
  const inspectFilesystem = jest.fn().mockResolvedValue(result);
  await expect(
    validateEntrypointTarget("bin/tool.mjs", "repo", undefined, inspectFilesystem),
  ).resolves.toContain(message);
  expect(inspectFilesystem).toHaveBeenCalledWith("bin/tool.mjs", "repo", undefined);
});

test("accepts a canonical target when filesystem inspection succeeds", async () => {
  const inspectFilesystem = jest.fn().mockResolvedValue(null);
  await expect(
    validateEntrypointTarget("./bin/tool.mjs", "repo", undefined, inspectFilesystem),
  ).resolves.toBeNull();
  expect(inspectFilesystem).toHaveBeenCalledWith("bin/tool.mjs", "repo", undefined);
});

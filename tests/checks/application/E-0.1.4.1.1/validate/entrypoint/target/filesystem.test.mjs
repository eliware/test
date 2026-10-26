import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTargetFilesystem } from "../../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target/filesystem.mjs";

test.each([
  [null, null],
  ["symlink", "Entrypoint target path must not contain a symlink: bin/tool.mjs."],
  ["directory", "Entrypoint target path segment must be a directory: bin/tool.mjs."],
  ["file", "Entrypoint target must be an existing file: bin/tool.mjs."],
  ["missing", "Entrypoint target does not exist: bin/tool.mjs."],
])("formats filesystem result %s", async (result, expected) => {
  const inspect = jest.fn().mockResolvedValue(result);
  await expect(
    validateEntrypointTargetFilesystem("bin/tool.mjs", "bin/tool.mjs", "repo", jest.fn(), inspect),
  ).resolves.toBe(expected);
  expect(inspect).toHaveBeenCalledWith("bin/tool.mjs", "repo", expect.any(Function));
});

import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target.mjs";

test.each([
  [null, "nonempty repository-relative path"],
  ["", "nonempty repository-relative path"],
  ["  ", "nonempty repository-relative path"],
  ["/repo/bin/tool.mjs", "nonempty repository-relative path"],
  ["C:\\bin\\tool.mjs", "nonempty repository-relative path"],
  ["/bin/tool.mjs", "nonempty repository-relative path"],
  ["src/tool.mjs", "canonical path"],
  ["bin/../tool.mjs", "canonical path"],
  ["bin//tool.mjs", "canonical path"],
  ["bin/name:stream", "canonical path"],
])("rejects invalid target %s before checking the file system", async (target, message) => {
  const inspectFilesystem = jest.fn();
  await expect(
    validateEntrypointTarget(target, "repo", undefined, inspectFilesystem),
  ).resolves.toContain(message);
  expect(inspectFilesystem).not.toHaveBeenCalled();
});

test.each(["bin/tool.mjs", "./bin/tool.mjs", "bin\\tool.mjs"])(
  "normalizes the canonical target %s before file system inspection",
  async (target) => {
    const inspectFilesystem = jest.fn().mockResolvedValue(null);
    await expect(
      validateEntrypointTarget(target, "repo", undefined, inspectFilesystem),
    ).resolves.toBeNull();
    expect(inspectFilesystem).toHaveBeenCalledWith("bin/tool.mjs", "repo", undefined);
  },
);

test("composes filesystem inspection with its diagnostic", async () => {
  const inspectFilesystem = jest.fn().mockResolvedValue("missing");
  await expect(
    validateEntrypointTarget("bin/tool.mjs", "repo", undefined, inspectFilesystem),
  ).resolves.toBe("Entrypoint target does not exist: bin/tool.mjs.");
  expect(inspectFilesystem).toHaveBeenCalledWith("bin/tool.mjs", "repo", undefined);
});

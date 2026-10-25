import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target.mjs";

test("does not inspect the file system when the path validator rejects a target", async () => {
  const inspectFilesystem = jest.fn();
  await expect(
    validateEntrypointTarget("src/tool.mjs", "repo", undefined, inspectFilesystem),
  ).resolves.toContain("canonical path");
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

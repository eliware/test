import { beforeEach, expect, jest, test } from "@jest/globals";
const execFile = jest.fn();
jest.unstable_mockModule("node:child_process", () => ({ execFile }));
const findIgnoredRepositoryPaths = (
  await import("../../../../../../src/validation/shared/repository/find-repository-files/find/ignored-repository-paths.mjs")
).default;
beforeEach(() => execFile.mockReset());
test("parses Git ignored paths", async () => {
  execFile.mockImplementation((_command, _args, _options, callback) =>
    callback(null, { stdout: Buffer.from("ignored/\0nested/file\0"), stderr: Buffer.alloc(0) }),
  );
  await expect(findIgnoredRepositoryPaths("repo")).resolves.toEqual(
    new Set(["ignored", "nested/file"]),
  );
});
test("returns no ignored paths when Git cannot read them", async () => {
  execFile.mockImplementation((_command, _args, _options, callback) => callback(new Error("git")));
  await expect(findIgnoredRepositoryPaths("repo")).resolves.toEqual(new Set());
});

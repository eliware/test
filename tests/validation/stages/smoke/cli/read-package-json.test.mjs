import { expect, jest, test } from "@jest/globals";
import { readSmokePackageJson } from "../../../../../src/validation/stages/smoke/cli/read-package-json.mjs";

test("reads and parses the target package manifest", async () => {
  const read = jest.fn(async () => '{"name":"consumer"}');
  await expect(readSmokePackageJson("repo", read)).resolves.toEqual({ name: "consumer" });
  expect(read).toHaveBeenCalledWith(expect.stringMatching(/repo[\\/]package\.json$/u), "utf8");
});

test("rejects unreadable and invalid package manifests", async () => {
  await expect(readSmokePackageJson("repo", async () => "{")).rejects.toThrow();
  await expect(
    readSmokePackageJson("repo", async () => Promise.reject(new Error("read"))),
  ).rejects.toThrow("read");
});

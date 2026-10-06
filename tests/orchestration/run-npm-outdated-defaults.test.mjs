import { expect, jest, test } from "@jest/globals";

const execute = jest.fn(async () => ({ code: 0, stdout: "{}", stderr: "" }));
jest.unstable_mockModule("../../src/orchestration/general/E-0.1/E-0.1.20/run-child.mjs", () => ({
  runChild: execute,
}));
const { runNpmOutdated } = await import("../../src/orchestration/run-npm-outdated.mjs");

test("uses all defaults when no options are supplied", async () => {
  await expect(runNpmOutdated("repo")).resolves.toEqual({ dependencies: {}, outdated: [] });
  expect(execute).toHaveBeenCalledWith(
    expect.any(String),
    expect.arrayContaining(["outdated", "--json"]),
    expect.objectContaining({ cwd: "repo" }),
  );
});

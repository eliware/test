import { expect, jest, test } from "@jest/globals";

const defaultExecute = jest.fn(async () => ({ code: 0, stdout: "{}", stderr: "" }));
jest.unstable_mockModule("../../../../src/validation/shared/process/run-child.mjs", () => ({
  runChild: defaultExecute,
}));
const { runNpmOutdated } =
  await import("../../../../src/validation/stages/outdated/run-npm-outdated.mjs");

test("parses npm outdated output and returns stable package findings", async () => {
  const execute = jest.fn(async () => ({
    code: 1,
    stdout: JSON.stringify({ zeta: { current: "1" }, alpha: { current: "2" } }),
    stderr: "",
  }));
  await expect(
    runNpmOutdated("C:/repo", {
      env: { ELIWARE_TEST_SMOKE_CANDIDATE: "zeta" },
      platform: "linux",
      execute,
    }),
  ).resolves.toEqual({
    dependencies: { zeta: { current: "1" }, alpha: { current: "2" } },
    outdated: ["alpha@latest"],
  });
  expect(execute).toHaveBeenCalledWith(
    "npm",
    ["outdated", "--json"],
    expect.objectContaining({ cwd: "C:/repo" }),
  );
});

test("rejects npm outdated process and JSON failures", async () => {
  await expect(
    runNpmOutdated("repo", {
      env: {},
      platform: "linux",
      execute: async () => ({ code: 2, stdout: "", stderr: "registry failed" }),
    }),
  ).rejects.toThrow("registry failed");
  await expect(
    runNpmOutdated("repo", {
      env: {},
      platform: "linux",
      execute: async () => ({ code: 0, stdout: "not-json", stderr: "" }),
    }),
  ).rejects.toThrow("invalid JSON");
  await expect(
    runNpmOutdated("repo", {
      env: {},
      platform: "linux",
      execute: async () => ({ code: 2, stdout: "", stderr: "" }),
    }),
  ).rejects.toThrow("npm outdated failed with code 2");
  await expect(
    runNpmOutdated("repo", {
      env: {},
      platform: "linux",
      execute: async () => ({ code: 0, stdout: "not-json", stderr: "parse diagnostic" }),
    }),
  ).rejects.toThrow("parse diagnostic");
});

test("uses defaults when no options are supplied", async () => {
  await expect(runNpmOutdated("repo")).resolves.toEqual({
    dependencies: {},
    outdated: [],
  });
  expect(defaultExecute).toHaveBeenCalledWith(
    expect.any(String),
    expect.arrayContaining(["outdated", "--json"]),
    expect.objectContaining({ cwd: "repo" }),
  );
});

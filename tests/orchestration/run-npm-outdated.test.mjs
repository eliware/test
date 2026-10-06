import { expect, jest, test } from "@jest/globals";
import { runNpmOutdated } from "../../src/orchestration/run-npm-outdated.mjs";

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

test("uses runtime defaults when only the process runner is supplied", async () => {
  const execute = jest.fn(async () => ({ code: 0, stdout: "{}", stderr: "" }));
  await expect(runNpmOutdated("repo", { execute })).resolves.toEqual({
    dependencies: {},
    outdated: [],
  });
  expect(execute).toHaveBeenCalledWith(
    expect.any(String),
    expect.arrayContaining(["outdated", "--json"]),
    expect.objectContaining({ cwd: "repo" }),
  );
});

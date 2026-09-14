import { expect, test } from "@jest/globals";
import { runOxlint } from "../../../../../src/checks/general/E-1/E-1.4/run-oxlint.mjs";

test("runs Oxlint through an injected argument-array executor", async () => {
  const calls = [];
  const result = await runOxlint("C:/repo", async (...args) => {
    calls.push(args);
    return { code: 0, stdout: "", stderr: "" };
  });
  expect(result.code).toBe(0);
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1]).toEqual(expect.arrayContaining(["--deny-warnings", "."]));
  expect(calls[0][2]).toMatchObject({ cwd: "C:/repo" });
});

test("passes the resolved executable to the injected runner", async () => {
  const calls = [];
  await expect(
    runOxlint("C:/repo", async (...args) => {
      calls.push(args);
      return { code: 1, stdout: "out", stderr: "err" };
    }, async () => "C:/pkg/oxlint.js"),
  ).resolves.toEqual({ code: 1, stdout: "out", stderr: "err" });
  expect(calls[0]).toEqual([
    process.execPath,
    ["C:/pkg/oxlint.js", "--deny-warnings", "."],
    { cwd: "C:/repo" },
  ]);
});

test("supports the default child-process runner", async () => {
  await expect(
    runOxlint(process.cwd(), undefined, async () => process.execPath),
  ).resolves.toEqual(expect.objectContaining({ code: expect.any(Number) }));
});

import { expect, test } from "@jest/globals";
import { runNpmPack } from "../../../../src/checks/npm-published/E-1.140/run-npm-pack.mjs";

test("runs npm pack in the repository root", async () => {
  const calls = [];
  const result = await runNpmPack("C:\\repo", async (...args) => {
    calls.push(args);
    return { code: 0, signal: null, stdout: "", stderr: "" };
  });
  expect(result.code).toBe(0);
  expect(calls).toHaveLength(1);
  expect(calls[0][1].slice(-3)).toEqual(["pack", "--dry-run", "--json"]);
  expect(calls[0][2]).toEqual({ cwd: "C:\\repo" });
});

test("uses npm's executable when npm invokes the harness", async () => {
  const previous = process.env.npm_execpath;
  process.env.npm_execpath = "C:\\npm\\cli.js";
  const calls = [];
  try {
    await runNpmPack("C:\\repo", async (...args) => {
      calls.push(args);
      return { code: 0, signal: null, stdout: "", stderr: "" };
    });
  } finally {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  }
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1][0]).toBe("C:\\npm\\cli.js");
});

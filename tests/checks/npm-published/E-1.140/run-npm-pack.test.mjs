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

test("supports the default runner with an injected command resolver", async () => {
  await expect(
    runNpmPack(process.cwd(), undefined, () => [process.execPath, []]),
  ).resolves.toEqual(expect.objectContaining({ code: expect.any(Number) }));
});

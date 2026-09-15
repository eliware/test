import { expect, test } from "@jest/globals";
import { runNpmAudit } from "../../../../../src/checks/general/E-1/E-1.20/run-npm-audit.mjs";

test("runs npm audit in the repository root", async () => {
  const calls = [];
  const result = await runNpmAudit("C:\\repo", async (...args) => {
    calls.push(args);
    return { code: 0, signal: null, stdout: "", stderr: "" };
  });

  expect(result.code).toBe(0);
  expect(calls).toHaveLength(1);
  expect(calls[0][1].slice(-3)).toEqual(["audit", "--json", "--audit-level=high"]);
  expect(calls[0][2]).toEqual({ cwd: "C:\\repo" });
});

test("supports an injected executable resolver", async () => {
  const calls = [];
  await runNpmAudit("C:\\repo", async (...args) => {
    calls.push(args);
    return { code: 0, signal: null, stdout: "", stderr: "" };
  }, () => ["npm", ["custom-cli.js"]]);
  expect(calls[0][0]).toBe("npm");
  expect(calls[0][1][0]).toBe("custom-cli.js");
});

test("uses npm's executable when npm invokes the harness", async () => {
  const previous = process.env.npm_execpath;
  process.env.npm_execpath = "C:\\npm\\cli.js";
  const calls = [];
  try {
    await runNpmAudit("C:\\repo", async (...args) => {
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

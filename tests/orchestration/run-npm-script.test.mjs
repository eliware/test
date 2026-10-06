import { expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { runNpmScript } from "../../src/orchestration/run-npm-script.mjs";

test("runs a package script in the repository root", async () => {
  const calls = [];
  await expect(
    runNpmScript("C:\\repo", "typecheck", async (...args) => {
      calls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    }),
  ).resolves.toEqual({ code: 0, stdout: "", stderr: "" });
  expect(calls[0][1].slice(-3)).toEqual(["run", "typecheck", "--silent"]);
  expect(calls[0][2]).toEqual({ cwd: "C:\\repo", env: expect.any(Object) });
});

test("uses platform npm when the invocation environment contains a Windows npm path on POSIX", async () => {
  const calls = [];
  const env = { npm_execpath: "C:/custom/npm-cli.js", TOKEN: "invocation-token" };
  await runNpmScript(
    "C:/repo",
    "typecheck",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    undefined,
    env,
    "linux",
  );

  expect(calls[0][0]).toBe("npm");
  expect(calls[0][1]).not.toContain("C:/custom/npm-cli.js");
  expect(calls[0][2]).toEqual({ cwd: "C:/repo", env });
  expect(calls[0][2].env).not.toBe(env);
});

test("uses the platform npm fallback when invocation omits npm_execpath", async () => {
  const calls = [];
  await runNpmScript(
    "C:/repo",
    "typecheck",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    undefined,
    {},
  );

  if (process.platform === "win32") expect(calls[0][0]).toBe(process.execPath);
  else expect(calls[0][0]).toBe("npm");
});

test("accepts an injected platform and Node executable path", async () => {
  const calls = [];
  const env = { npm_execpath: "/tools/npm-cli.js" };
  await runNpmScript(
    "/repo",
    "typecheck",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    undefined,
    env,
    "linux",
    "/tools/node",
  );

  expect(calls[0][0]).toBe("/tools/node");
  expect(calls[0][1]).toContain("/tools/npm-cli.js");
});

test("uses the default runner with an injected child-process adapter", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "close") handler(0, null);
  });

  await expect(runNpmScript("C:\\repo", "typecheck", undefined, () => child)).resolves.toEqual({
    code: 0,
    signal: null,
    stdout: "",
    stderr: "",
  });
});

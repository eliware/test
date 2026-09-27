import { expect, jest, test } from "@jest/globals";
import { runNpmAudit } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-npm-audit.mjs";

test("runs npm audit in the repository root", async () => {
  const calls = [];
  const result = await runNpmAudit("C:\\repo", async (...args) => {
    calls.push(args);
    return { code: 0, signal: null, stdout: "", stderr: "" };
  });

  expect(result.code).toBe(0);
  expect(calls).toHaveLength(1);
  expect(calls[0][1].slice(-3)).toEqual(["audit", "--json", "--audit-level=high"]);
  expect(calls[0][2].cwd).toBe("C:\\repo");
  const pathKey = process.env.Path === undefined ? "PATH" : "Path";
  expect(calls[0][2].env).toEqual(expect.objectContaining({ [pathKey]: process.env[pathKey] }));
});

test("supports an injected executable resolver", async () => {
  const calls = [];
  await runNpmAudit(
    "C:\\repo",
    async (...args) => {
      calls.push(args);
      return { code: 0, signal: null, stdout: "", stderr: "" };
    },
    () => ["npm", ["custom-cli.js"]],
  );
  expect(calls[0][0]).toBe("npm");
  expect(calls[0][1][0]).toBe("custom-cli.js");
});

test("forwards additional npm audit arguments", async () => {
  const calls = [];
  await runNpmAudit(
    "C:\\repo",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    () => ["npm", []],
    ["--no-fund"],
  );
  expect(calls[0][1]).toEqual(["audit", "--no-fund", "--json", "--audit-level=high"]);
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

test("uses the invocation environment for executable selection and child execution", async () => {
  const calls = [];
  const env = {
    npm_execpath: "C:\\selected\\npm-cli.js",
    PATH: "C:\\selected-bin",
    npm_config_registry: "https://example.invalid/",
  };
  await runNpmAudit(
    "C:\\repo",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    (options) => {
      expect(options.env).toBe(env);
      return [process.execPath, [env.npm_execpath]];
    },
    [],
    env,
  );
  expect(calls[0][1][0]).toBe(env.npm_execpath);
  expect(calls[0][2].env).toEqual(env);
});

test("rejects audit overrides before executable resolution or child execution", async () => {
  const run = jest.fn();
  const resolve = jest.fn(() => ["npm", []]);
  await expect(runNpmAudit("C:\\repo", run, resolve, ["--audit-level=low"], {})).rejects.toThrow(
    "cannot override",
  );
  expect(run).not.toHaveBeenCalled();
  expect(resolve).not.toHaveBeenCalled();
});

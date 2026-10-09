import { expect, jest, test } from "@jest/globals";

const execute = jest.fn();
jest.unstable_mockModule(
  "../../../src/validation/shared/process/execute-child-process.mjs",
  () => ({ execute }),
);
const { ruleId, run } = await import("../../../src/checks/cli/E-0.1.5.1.0.mjs");

const packageJson = { version: "12.0.0", bin: { eliwareTest: "bin/eliware-test.mjs" } };
const repositoryInventory = {
  readText: async (path) => (path === "AGENTS.md" ? "## CLI" : "## Exit codes"),
};

test("rejects a CLI package without a bin entrypoint", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  await expect(run({ packageJson: {}, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "CLI repositories must declare a bin entrypoint.",
  });
});

test("executes the package entrypoint through an injected process runner", async () => {
  await expect(
    run(
      {
        root: process.cwd(),
        packageJson: { version: "12.0.0", bin: "bin/eliware-test.mjs" },
        repositoryInventory,
      },
      {
        execute: async (_command, args) => ({
          code: 0,
          stdout: args.at(-1) === "--version" ? "12.0.0\n" : "Usage\n",
        }),
      },
    ),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the default runner through its mocked process adapter", async () => {
  execute.mockImplementation(async (_command, args) => ({
    code: 0,
    stdout: args.at(-1) === "--version" ? "12.0.0\n" : "Usage\n",
  }));
  await expect(run({ root: process.cwd(), packageJson, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(execute).toHaveBeenCalledTimes(2);
});

test("runs help and version for every public command", async () => {
  const calls = [];
  await expect(
    run(
      { root: process.cwd(), packageJson, repositoryInventory },
      {
        execute: async (_command, args) => {
          calls.push(args.at(-1));
          return { code: 0, stdout: args.at(-1) === "--version" ? "12.0.0\n" : "Usage\n" };
        },
      },
    ),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
  expect(calls).toEqual(["--help", "--version"]);
});

test("fails when version output does not match package metadata", async () => {
  const result = await run(
    { packageJson, repositoryInventory },
    {
      execute: async () => ({ code: 0, stdout: "12.0.1\n" }),
    },
  );
  expect(result.status).toBe("fail");
  expect(result.message).toContain("must report package version 12.0.0");
});

import { expect, jest, test } from "@jest/globals";
import { executeCliInformationCommands } from "../../../../src/checks/cli/E-0.1.60/execute-cli-information-commands.mjs";

const context = { root: "/repo", entrypoints: ["bin/cli.mjs"], packageVersion: "1.2.3" };

test("runs help and version and combines stdout with stderr", async () => {
  const executeEntrypoint = jest.fn(async (_command, args) => ({
    code: 0,
    stdout: args[1] === "--version" ? "" : "Usage ",
    stderr: args[1] === "--version" ? "1.2.3\n" : "output\n",
  }));
  await expect(executeCliInformationCommands({ ...context, executeEntrypoint })).resolves.toBe("");
  expect(executeEntrypoint).toHaveBeenCalledTimes(2);
});

test("reports execution, exit, output, and version errors", async () => {
  await expect(
    executeCliInformationCommands({
      ...context,
      executeEntrypoint: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toContain("could not execute --help: spawn failed");
  await expect(
    executeCliInformationCommands({
      ...context,
      executeEntrypoint: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toContain("must exit 0 for --help; received 1");
  await expect(
    executeCliInformationCommands({
      ...context,
      executeEntrypoint: async () => ({ code: 0 }),
    }),
  ).resolves.toContain("must produce output for --help");
  await expect(
    executeCliInformationCommands({
      ...context,
      executeEntrypoint: async (_command, args) => ({
        code: 0,
        stdout: args[1] === "--version" ? "1.2.4" : "Usage",
      }),
    }),
  ).resolves.toContain("must report package version 1.2.3");
});

test("does not compare a version when package metadata omits it", async () => {
  await expect(
    executeCliInformationCommands({
      root: "/repo",
      entrypoints: ["bin/cli.mjs"],
      executeEntrypoint: async () => ({ code: 0, stdout: "ok" }),
    }),
  ).resolves.toBe("");
});

test("accepts a matching version token alongside informational output", async () => {
  await expect(
    executeCliInformationCommands({
      ...context,
      executeEntrypoint: async (_command, args) => ({
        code: 0,
        stdout: args[1] === "--version" ? "eliware-test version 1.2.3\n" : "Usage",
      }),
    }),
  ).resolves.toBe("");
});

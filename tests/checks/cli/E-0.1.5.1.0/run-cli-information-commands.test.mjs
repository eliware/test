import { expect, jest, test } from "@jest/globals";
import { runCliInformationCommands } from "../../../../src/checks/cli/E-0.1.5.1.0/run-cli-information-commands.mjs";

const run = (executeEntrypoint) =>
  runCliInformationCommands({
    root: process.cwd(),
    entrypoints: ["bin/cli.mjs"],
    packageVersion: "12.0.0",
    executeEntrypoint,
  });

test("runs both informational arguments", async () => {
  const execute = jest.fn(async (_node, args) => ({
    code: 0,
    stdout: args.at(-1) === "--version" ? "12.0.0\n" : "Usage\n",
  }));
  await expect(run(execute)).resolves.toEqual([]);
  expect(execute.mock.calls.map(([, args]) => args.at(-1))).toEqual(["--help", "--version"]);
});

test("accepts output on stderr", async () => {
  await expect(
    run(async (_node, args) => ({
      code: 0,
      stderr: args.at(-1) === "--version" ? "12.0.0" : "Usage",
    })),
  ).resolves.toEqual([]);
});

test("accepts a label and v prefix with the package version", async () => {
  await expect(
    run(async (_node, args) => ({
      code: 0,
      stdout: args.at(-1) === "--version" ? "Eliware CLI v12.0.0" : "Usage",
    })),
  ).resolves.toEqual([]);
});

test("reports command status, empty output, and version mismatch", async () => {
  let call = 0;
  const execute = async () => {
    call += 1;
    return call === 1 ? { code: 1, stdout: "Usage" } : { code: 0, stdout: "wrong" };
  };
  await expect(run(execute)).resolves.toEqual([
    "CLI entrypoint bin/cli.mjs must exit 0 for --help.",
    "CLI entrypoint bin/cli.mjs --version must report package version 12.0.0.",
  ]);
});

test("rejects output that reports more than one version", async () => {
  await expect(
    run(async (_node, args) => ({
      code: 0,
      stdout: args.at(-1) === "--version" ? "12.0.0 (latest 12.0.1)" : "Usage",
    })),
  ).resolves.toContain("CLI entrypoint bin/cli.mjs --version must report package version 12.0.0.");
});

test("rejects version output when package metadata has no version", async () => {
  await expect(
    runCliInformationCommands({
      root: process.cwd(),
      entrypoints: ["bin/cli.mjs"],
      executeEntrypoint: async (_node, args) => ({
        code: 0,
        stdout: args.at(-1) === "--version" ? "12.0.0" : "Usage",
      }),
    }),
  ).resolves.toContain(
    "CLI entrypoint bin/cli.mjs --version must report package version undefined.",
  );
});

test("reports execution errors and empty command output", async () => {
  let call = 0;
  const execute = async () => {
    call += 1;
    if (call === 1) throw new Error("missing file");
    return { code: 0, stdout: "" };
  };
  await expect(run(execute)).resolves.toEqual([
    "CLI entrypoint bin/cli.mjs could not execute --help: missing file",
    "CLI entrypoint bin/cli.mjs must produce output for --version.",
  ]);
});

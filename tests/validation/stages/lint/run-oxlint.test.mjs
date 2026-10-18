import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";

const spawn = jest.fn();
jest.unstable_mockModule("node:child_process", () => ({ spawn }));
const { execute } =
  await import("../../../../src/validation/shared/process/execute-child-process.mjs");
const { runOxlint } = await import("../../../../src/validation/stages/lint/run-oxlint.mjs");

test("runs Oxlint through an injected argument-array executor", async () => {
  const calls = [];
  const result = await runOxlint("C:/repo", async (...args) => {
    calls.push(args);
    return { code: 0, stdout: "", stderr: "" };
  });
  expect(result.code).toBe(0);
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1]).toEqual(
    expect.arrayContaining(["--deny-warnings", "--no-error-on-unmatched-pattern", "."]),
  );
  expect(calls[0][2]).toMatchObject({ cwd: "C:/repo" });
});

test("passes the resolved executable to the injected runner", async () => {
  const calls = [];
  await expect(
    runOxlint(
      "C:/repo",
      async (...args) => {
        calls.push(args);
        return { code: 1, stdout: "out", stderr: "err" };
      },
      async () => "C:/pkg/oxlint.js",
    ),
  ).resolves.toEqual({ code: 1, stdout: "out", stderr: "err" });
  expect(calls[0]).toEqual([
    process.execPath,
    ["C:/pkg/oxlint.js", "--deny-warnings", "--no-error-on-unmatched-pattern", "."],
    { cwd: "C:/repo" },
  ]);
});

test("forwards additional Oxlint arguments", async () => {
  const calls = [];
  await runOxlint(
    "C:/repo",
    async (...args) => {
      calls.push(args);
      return { code: 0 };
    },
    async () => "C:/pkg/oxlint.js",
    ["--threads=2"],
  );
  expect(calls[0][1]).toEqual([
    "C:/pkg/oxlint.js",
    "--deny-warnings",
    "--no-error-on-unmatched-pattern",
    ".",
    "--threads=2",
  ]);
});

test("supports the child-process runner with an injected child adapter", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const run = (...args) =>
    execute(...args, () => {
      queueMicrotask(() => child.emit("close", 0, null));
      return child;
    });
  const result = runOxlint(process.cwd(), run, async () => "mock-oxlint.js");
  await expect(result).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("uses the default executor with a mocked child process", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  spawn.mockImplementation(() => {
    queueMicrotask(() => child.emit("close", 0, null));
    return child;
  });
  await expect(
    runOxlint("C:/repo", undefined, async () => "mock-oxlint.js"),
  ).resolves.toMatchObject({ code: 0 });
  expect(spawn).toHaveBeenCalledWith(
    process.execPath,
    ["mock-oxlint.js", "--deny-warnings", "--no-error-on-unmatched-pattern", "."],
    expect.objectContaining({ cwd: "C:/repo", shell: false }),
  );
});

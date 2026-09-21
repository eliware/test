import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runPrettier } from "../../src/checks/run-prettier.mjs";

test("uses the default formatter runner with an injected child adapter", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "close") handler(0, null);
  });

  await expect(
    runPrettier(
      "C:\\repo",
      { write: true },
      undefined,
      async () => "C:\\prettier.cjs",
      () => child,
    ),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("uses default formatter resolution when a runner override is supplied", async () => {
  const calls = [];
  await expect(
    runPrettier(process.cwd(), undefined, async (...args) => {
      calls.push(args);
      return { code: 0, signal: null, stdout: "", stderr: "" };
    }),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1]).toEqual(expect.arrayContaining(["--check", "."]));
});

test("forwards additional Prettier arguments", async () => {
  const calls = [];
  await runPrettier(
    "C:/repo",
    { extraArgs: ["--ignore-path", "custom.ignore"] },
    async (...args) => {
      calls.push(args);
      return { code: 0, signal: null, stdout: "", stderr: "" };
    },
    async () => "C:/prettier.cjs",
  );
  expect(calls[0][1]).toEqual([
    "C:/prettier.cjs",
    "--check",
    ".",
    "--ignore-path",
    "custom.ignore",
  ]);
});

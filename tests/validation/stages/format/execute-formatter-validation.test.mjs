import { expect, jest, test } from "@jest/globals";
import { executeFormatterValidation } from "../../../../src/validation/stages/format/execute-formatter-validation.mjs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("runs format and format-check modes with the correct write setting", async () => {
  const calls = [];
  const runFormatter = async (root, options) => {
    calls.push({ root, options });
    return { code: 0, stdout: "", stderr: "" };
  };
  await expect(
    executeFormatterValidation({
      root: "/repo",
      executeFormat: true,
      mode: "format-check",
      runFormatter,
    }),
  ).resolves.toBe("");
  await expect(
    executeFormatterValidation({
      root: "/repo",
      executeFormat: true,
      mode: "format",
      runFormatter,
    }),
  ).resolves.toBe("");
  expect(calls).toEqual([
    { root: "/repo", options: { write: false, extraArgs: [] } },
    { root: "/repo", options: { write: true, extraArgs: [] } },
  ]);
});

test("runs an explicitly selected format mode when aggregate formatting is disabled", async () => {
  const env = { FORMAT_CONTEXT: "focused" };
  const runFormatter = jest.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
  await expect(
    executeFormatterValidation({
      root: process.cwd(),
      executeFormat: false,
      mode: "format-check",
      env,
      runFormatter,
    }),
  ).resolves.toBe("");
  expect(runFormatter).toHaveBeenCalledTimes(1);
  expect(runFormatter.mock.calls[0][1].env).toBe(env);
});

test("returns formatter diagnostics and startup failures", async () => {
  await expect(
    executeFormatterValidation({
      executeFormat: true,
      mode: "format-check",
      runFormatter: async () => ({ code: 1, stdout: "bad.js", stderr: "" }),
    }),
  ).resolves.toBe("Prettier failed: bad.js");
  await expect(
    executeFormatterValidation({
      executeFormat: true,
      mode: "format-check",
      runFormatter: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toBe("Prettier failed without diagnostics.");
  await expect(
    executeFormatterValidation({
      executeFormat: true,
      mode: "format",
      runFormatter: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toBe("Prettier could not be started: spawn failed");
});

test("rejects forwarded formatter options that can change mode, config, or file coverage", async () => {
  const runFormatter = jest.fn(async () => ({ code: 0 }));
  for (const toolArgs of [
    ["--write"],
    ["--ignore-path", "custom.ignore"],
    ["--single-quote"],
    ["src/example.mjs"],
  ]) {
    await expect(
      executeFormatterValidation({
        executeFormat: true,
        mode: "format-check",
        runFormatter,
        toolArgs,
      }),
    ).resolves.toContain("conflicts with wrapper-owned");
  }
  expect(runFormatter).not.toHaveBeenCalled();
});

test("skips disabled or unrelated formatter stages and scopes focused paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-format-"));
  await mkdir(join(root, "tests"), { recursive: true });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "tests", "example.test.mjs"), "test('example', () => {});\n");
  await writeFile(join(root, "src", "example.mjs"), "export {};\n");
  const runFormatter = jest.fn(async () => ({ code: 0 }));
  try {
    await expect(
      executeFormatterValidation({
        executeFormat: false,
        mode: null,
        runFormatter,
        toolArgs: ["--write"],
      }),
    ).resolves.toBeNull();
    await expect(
      executeFormatterValidation({
        executeFormat: true,
        mode: "lint",
        runFormatter,
        toolArgs: ["--write"],
      }),
    ).resolves.toBeNull();
    await executeFormatterValidation({
      root,
      executeFormat: true,
      mode: "format-check",
      focusedScope: { paths: ["tests/example.test.mjs", "src/example.mjs"] },
      runFormatter,
    });
    expect(runFormatter).toHaveBeenCalledWith(
      root,
      expect.objectContaining({
        paths: ["tests/example.test.mjs", "src/example.mjs"],
      }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed when a focused formatting path does not exist", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-format-missing-"));
  const runFormatter = jest.fn(async () => ({ code: 0 }));
  try {
    await expect(
      executeFormatterValidation({
        root,
        executeFormat: true,
        mode: "format-check",
        focusedScope: { paths: ["src/missing.mjs"] },
        runFormatter,
      }),
    ).resolves.toBe("Focused formatting requires at least one resolved path.");
    expect(runFormatter).not.toHaveBeenCalled();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

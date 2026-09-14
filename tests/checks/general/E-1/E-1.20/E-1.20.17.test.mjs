import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.17.mjs";

const scripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

test("requires the exact shared validation scripts", async () => {
  await expect(run({ packageJson: { scripts } })).resolves.toEqual({
    ruleId: "E-1.20.17",
    status: "pass",
    message: "",
  });
  await expect(run({ packageJson: { scripts: { ...scripts, test: "jest" } } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("runs the formatter in aggregate and explicit format modes", async () => {
  const calls = [];
  const runFormatter = async (root, options) => {
    calls.push({ root, options });
    return { code: 0, stdout: "", stderr: "" };
  };
  for (const mode of [null, "format-check", "format"]) {
    await expect(
      run({ packageJson: { scripts }, root: "/repo", executeFormat: true, mode, runFormatter }),
    ).resolves.toEqual({
      ruleId: "E-1.20.17",
      status: "pass",
      message: "",
    });
  }
  expect(calls).toEqual([
    { root: "/repo", options: { write: false } },
    { root: "/repo", options: { write: false } },
    { root: "/repo", options: { write: true } },
  ]);
});

test("reports formatter failures", async () => {
  const result = await run({
    packageJson: { scripts },
    root: "/repo",
    executeFormat: true,
    mode: "format-check",
    runFormatter: async () => ({ code: 1, stdout: "bad.js", stderr: "" }),
  });
  expect(result).toEqual(
    expect.objectContaining({ status: "fail", message: "Prettier failed: bad.js" }),
  );
});

test("reports formatter failures without diagnostics", async () => {
  await expect(
    run({
      packageJson: { scripts },
      root: "/repo",
      executeFormat: true,
      mode: "format-check",
      runFormatter: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.17",
    status: "fail",
    message: "Prettier failed without diagnostics.",
  });
});

test("reports formatter startup failures", async () => {
  await expect(
    run({
      packageJson: { scripts },
      root: "/repo",
      executeFormat: true,
      mode: "format",
      runFormatter: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.17",
    status: "fail",
    message: "Prettier could not be started: spawn failed",
  });
});

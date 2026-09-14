import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runJest } from "../../../../../src/checks/general/E-1/E-1.20/run-jest.mjs";
import { buildJestArguments } from "../../../../../src/checks/general/E-1/E-1.20/build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "../../../../../src/checks/general/E-1/E-1.20/resolve-focused-coverage.mjs";
import { runChild } from "../../../../../src/checks/general/E-1/E-1.20/run-child.mjs";

test("builds the default in-band coverage command", () => {
  expect(buildJestArguments([])).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments()).toEqual(["--coverage", "--runInBand"]);
});

test("preserves focused paths and filters harness-only options", () => {
  expect(
    buildJestArguments(["tests/a.test.mjs", "--ignore-100x4", "--debug-timing", "--no-runInBand"]),
  ).toEqual(["--coverage", "--json", "--runTestsByPath", "tests/a.test.mjs", "--no-runInBand"]);
});

test("rejects a missing focused test before invoking Jest", async () => {
  let invoked = false;
  await expect(
    runJest("C:/fixture", ["tests/missing.test.mjs"], async () => {
      invoked = true;
      return { code: 0, stdout: "", stderr: "" };
    }),
  ).rejects.toThrow("Focused test path does not exist");
  expect(invoked).toBe(false);
});

test("maps a focused test to its mirrored source coverage", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "sample.mjs"), "export {};\n");
  await writeFile(join(root, "tests", "sample.test.mjs"), 'test("sample", () => {});\n');
  let received;
  await runJest(root, ["tests/sample.test.mjs"], async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  });
  expect(received[1]).toEqual([
    "node_modules/jest/bin/jest.js",
    "--coverage",
    "--coverageReporters=json",
    "--coverageReporters=json-summary",
    "--coverageReporters=text",
    "--reporters",
    expect.stringContaining("jest-progress-reporter.mjs"),
    "--collectCoverageFrom",
    "src/sample.mjs",
    "--runTestsByPath",
    "tests/sample.test.mjs",
    "--runInBand",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("supports non-test focused paths without focused coverage mapping", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "README.md"), "notes\n");
  let received;
  await runJest(root, ["tests/README.md"], async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  });
  expect(received[1]).not.toContain("--collectCoverageFrom");
  await rm(root, { recursive: true, force: true });
});

test("returns no focused coverage for absent or unmappable source paths", async () => {
  await expect(resolveFocusedCoverage("C:/fixture", undefined)).resolves.toEqual([]);
  await expect(resolveFocusedCoverage("C:/fixture", "tests/sample.test.mjs")).resolves.toEqual([]);
});

test("returns no focused coverage when the mirrored source is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "sample.test.mjs"), 'test("sample", () => {});\n');
  await expect(resolveFocusedCoverage(root, "tests/sample.test.mjs")).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("preserves an existing VM module option and forwards non-focused arguments", async () => {
  const previous = process.env.NODE_OPTIONS;
  process.env.NODE_OPTIONS = "--experimental-vm-modules --trace-warnings";
  try {
    let received;
    await runJest("C:/fixture", ["--watch"], async (...args) => {
      received = args;
      return { code: 0, stdout: "", stderr: "" };
    });
    expect(received[2].env.NODE_OPTIONS).toBe(process.env.NODE_OPTIONS);
    expect(received[1]).toContain("--watch");
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

test("captures child output, truncates oversized output, and reports spawn errors", async () => {
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('ok'); process.stderr.write('err')"]),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "ok", stderr: "err" });
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('x'.repeat(100001))"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stdout: expect.stringContaining("…") }));
  await expect(
    runChild(process.execPath, ["-e", "process.stderr.write('x'.repeat(100001))"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stderr: expect.stringContaining("…") }));
  await expect(runChild("C:\\missing-executable", [], {})).rejects.toBeTruthy();
});

test("raises the bounded debug-timing capture without making it unlimited", async () => {
  let received;
  const onStderr = jest.fn();
  await runJest("C:/fixture", ["--debug-timing"], async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  }, { onStderr });
  expect(received[2].maxOutputLength).toBe(10_000_000);
  expect(received[1]).toContain("--reporters");
  expect(received[2].onStderr).toEqual(expect.any(Function));
  received[2].onStderr("[eliware-test-progress] machine\nvisible\n");
  expect(onStderr).toHaveBeenCalledWith("visible\n");
  expect(received[2].progressTimeoutMs).toBe(15_000);
  expect(received[2].progressPattern).toEqual(/^\[eliware-test-progress\]/m);
});

test("reports the last started suite when progress stops", async () => {
  let received;
  await runJest("C:/fixture", [], async (...args) => {
    received = args;
    args[2].onProgress("[eliware-test-progress] start tests/hanging.test.mjs\n");
    args[2].onTimeout();
    return { code: null, timedOut: true, stdout: "", stderr: "" };
  }, { onTimeout: (message) => { received.timeoutMessage = message; } });
  expect(received.timeoutMessage).toBe("Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.");
});

test("uses default Jest arguments and child executor", async () => {
  await expect(runJest(process.cwd(), ["--help"])).resolves.toEqual(
    expect.objectContaining({ code: expect.anything() }),
  );
  let received;
  await runJest(process.cwd(), undefined, async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  });
  expect(received[1]).toContain("--runInBand");
});

test("adds the VM module option when it is absent", async () => {
  const previous = process.env.NODE_OPTIONS;
  delete process.env.NODE_OPTIONS;
  try {
    let received;
    await runJest(process.cwd(), [], async (...args) => {
      received = args;
      return { code: 0, stdout: "", stderr: "" };
    });
    expect(received[2].env.NODE_OPTIONS).toBe("--experimental-vm-modules --no-warnings");
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

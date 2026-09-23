import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { resolveConsumerJestCli, resolveJestCli, runJest } from "../../../../../src/checks/general/E-1/E-1.20/run-jest.mjs";
import { runChild } from "../../../../../src/checks/general/E-1/E-1.20/run-child.mjs";

test("resolves Jest from the consumer package", () => {
  expect(resolveConsumerJestCli(process.cwd())).toContain("jest.js");
  expect(resolveJestCli(process.cwd(), runChild, {})).toContain("jest.js");
  expect(resolveJestCli(process.cwd(), runChild, null)).toContain("jest.js");
  expect(resolveJestCli(process.cwd(), runChild)).toContain("jest.js");
  expect(resolveJestCli("C:/fixture", async () => {}, { jestCli: "jest-cli" })).toBe("jest-cli");
  expect(resolveJestCli("C:/fixture", runChild, { jestCli: "custom-jest" })).toBe("custom-jest");
});

test("reports a stable error when the consumer has no resolvable Jest", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-no-jest-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
  expect(() => resolveConsumerJestCli(root)).toThrow("Consumer repository Jest executable could not be resolved");
  await rm(root, { recursive: true, force: true });
});

test("rejects a missing focused test before invoking Jest", async () => {
  let invoked = false;
  await expect(
    runJest("C:/fixture", ["tests/missing.test.mjs"], async () => {
      invoked = true;
      return { code: 0, stdout: "", stderr: "" };
    }, { jestCli: "jest-cli" }),
  ).rejects.toThrow("Focused test path does not exist");
  expect(invoked).toBe(false);
});

test("supports non-test focused paths without focused coverage mapping", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "README.md"), "notes\n");
  let received;
  await runJest(root, ["tests/README.md"], async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  }, { jestCli: "jest-cli" });
  expect(received[1]).not.toContain("--collectCoverageFrom");
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
    }, { jestCli: "jest-cli" });
    expect(received[2].env.NODE_OPTIONS).toBe(process.env.NODE_OPTIONS);
    expect(received[1]).toContain("--watch");
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

test("raises the bounded debug-timing capture without making it unlimited", async () => {
  let received;
  const onStderr = jest.fn();
  await runJest(
    "C:/fixture",
    ["--debug-timing"],
    async (...args) => {
      received = args;
      return { code: 0, stdout: "", stderr: "" };
    },
    { onStderr, jestCli: "jest-cli" },
  );
  expect(received[2].maxOutputLength).toBe(1_000_000);
  expect(received[1]).toContain("--reporters");
  expect(received[2].onStderr).toEqual(expect.any(Function));
  received[2].onStderr("[eliware-test-progress] machine\nvisible\n");
  expect(onStderr).toHaveBeenCalledWith("[eliware-test-progress] machine\nvisible\n");
  expect(received[2].progressTimeoutMs).toBe(15_000);
  expect(received[2].progressPattern).toEqual(/^\[eliware-test-progress\]/m);
});

test("reports the last started suite when progress stops", async () => {
  let received;
  await runJest(
    "C:/fixture",
    ["--debug-timing"],
    async (...args) => {
      received = args;
      args[2].onProgress("[eliware-test-progress] start tests/hanging.test.mjs\n");
      args[2].onTimeout();
      return { code: null, timedOut: true, stdout: "", stderr: "" };
    },
    {
      onTimeout: (message) => {
        received.timeoutMessage = message;
      },
      jestCli: "jest-cli",
    },
  );
  expect(received.timeoutMessage).toBe(
    "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  );
});

test("uses default Jest arguments with an injected child executor", async () => {
  let received;
  await runJest("C:/fixture", undefined, async (...args) => {
    received = args;
    return { code: 0, stdout: "", stderr: "" };
  }, { jestCli: "jest-cli" });
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
    }, { jestCli: "jest-cli" });
    expect(received[2].env.NODE_OPTIONS).toBe("--experimental-vm-modules --no-warnings");
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

test("leaves same-worktree run exclusion to the caller", async () => {
  const root = "C:/shared-consumer";
  let releaseFirst;
  let started = 0;
  const first = runJest(root, [], async () => {
    started += 1;
    await new Promise((resolve) => { releaseFirst = resolve; });
    return { code: 0, stdout: "", stderr: "" };
  }, { jestCli: "jest-cli" });
  const second = runJest(root, [], async () => {
    started += 1;
    return { code: 0, stdout: "", stderr: "" };
  }, { jestCli: "jest-cli" });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(started).toBe(2);
  releaseFirst();
  await Promise.all([first, second]);
  expect(started).toBe(2);
});

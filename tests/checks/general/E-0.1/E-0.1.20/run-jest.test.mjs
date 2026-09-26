import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runJest } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs";

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

test("removes the isolated coverage directory when the executor throws", async () => {
  await expect(runJest(process.cwd(), [], async () => {
    throw new Error("spawn failed");
  }, { jestCli: "jest-cli" })).rejects.toThrow("spawn failed");
});

test("preserves an executor error when coverage cleanup also fails", async () => {
  await expect(runJest(process.cwd(), [], async () => {
    throw new Error("spawn failed");
  }, { jestCli: "jest-cli" }, async () => {
    throw new Error("cleanup denied");
  })).rejects.toMatchObject({
    message: "spawn failed\nCould not remove run-scoped coverage artifacts: cleanup denied",
    cause: expect.objectContaining({ message: "spawn failed" }),
  });
});

test("preserves non-Error executor and cleanup failures", async () => {
  await expect(runJest(process.cwd(), [], async () => {
    throw "spawn failed";
  }, { jestCli: "jest-cli" }, async () => {
    throw "cleanup denied";
  })).rejects.toMatchObject({
    message: "spawn failed\nCould not remove run-scoped coverage artifacts: cleanup denied",
    cause: "spawn failed",
  });
});

test("removes the isolated coverage directory after a nonzero Jest exit", async () => {
  let coverageDirectory;
  const result = await runJest(process.cwd(), [], async (_command, args) => {
    coverageDirectory = args[args.indexOf("--coverageDirectory") + 1];
    return { code: 1, stdout: "test failure details", stderr: "" };
  }, { jestCli: "jest-cli" });
  expect(result.stdout).toBe("test failure details");
  expect(result.coverageDirectory).toBeUndefined();
  await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
});

test("removes successful coverage artifacts when no coverage consumer retains them", async () => {
  let coverageDirectory;
  const result = await runJest(process.cwd(), [], async (_command, args) => {
    coverageDirectory = args[args.indexOf("--coverageDirectory") + 1];
    return { code: 0, stdout: "", stderr: "" };
  }, { jestCli: "jest-cli" });
  expect(result.coverageDirectory).toBeUndefined();
  await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
});

test("reports when successful coverage artifacts cannot be cleaned up", async () => {
  const result = await runJest(process.cwd(), [], async () => ({
    code: 0,
    stdout: "",
    stderr: "",
  }), { jestCli: "jest-cli" }, async () => {
    throw new Error("cleanup denied");
  });
  expect(result.cleanupError).toContain("cleanup denied");
  await rm(result.coverageDirectory, { recursive: true, force: true });
});

test("removes the isolated coverage directory after a timed-out result", async () => {
  let coverageDirectory;
  const result = await runJest(process.cwd(), [], async (_command, args) => {
    coverageDirectory = args[args.indexOf("--coverageDirectory") + 1];
    return { code: 0, timedOut: true, stdout: "partial output", stderr: "" };
  }, { jestCli: "jest-cli" });
  expect(result.timedOut).toBe(true);
  expect(result.coverageDirectory).toBeUndefined();
  await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
});

test("preserves a nonzero Jest result when coverage cleanup fails", async () => {
  let coverageDirectory;
  const result = await runJest(process.cwd(), [], async (_command, args) => {
    coverageDirectory = args[args.indexOf("--coverageDirectory") + 1];
    return { code: 1, stdout: "test failure details", stderr: "" };
  }, { jestCli: "jest-cli", retainCoverageDirectory: true }, async () => {
    throw new Error("cleanup denied");
  });
  try {
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("test failure details");
    expect(result.cleanupError).toContain("cleanup denied");
  } finally {
    await rm(coverageDirectory, { recursive: true, force: true });
  }
});

test("supports non-test focused paths without focused coverage mapping", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "package.json"), "{}\n");
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
    await runJest(process.cwd(), ["--watch"], async (...args) => {
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
    process.cwd(),
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
    process.cwd(),
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

test("retains coverage artifacts when requested", async () => {
  const result = await runJest(process.cwd(), undefined, async () => ({
    code: 0, stdout: "", stderr: "",
  }), { jestCli: "jest-cli", retainCoverageDirectory: true });
  expect(result.coverageDirectory).toMatch(/[\\/]coverage-/u);
});

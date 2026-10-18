import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
const spawn = jest.fn();
jest.unstable_mockModule("node:child_process", () => ({ spawn }));
const { execute } =
  await import("../../../../src/validation/shared/process/execute-child-process.mjs");
const { attachChildProcessOutput, terminateChildProcess } =
  await import("../../../../src/validation/shared/process/attach-child-process-output.mjs");
function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}
test("captures stream data and rejects stream errors after safe termination", () => {
  const child = childProcess();
  child.kill = jest.fn();
  const stream = new EventEmitter();
  const output = { push: jest.fn() };
  const reject = jest.fn();
  attachChildProcessOutput(child, stream, "stdout", output, reject, () => false);
  stream.emit("data", "captured");
  const failure = new Error("stream failed");
  stream.emit("error", failure);
  expect(output.push).toHaveBeenCalledWith("stdout", "captured");
  expect(reject).toHaveBeenCalledWith(failure);
  expect(child.kill).toHaveBeenCalledTimes(1);
});
test("keeps child errors when termination fails", () => {
  const child = {};
  Object.defineProperty(child, "kill", {
    get: () => {
      throw new Error("termination failed");
    },
  });
  expect(() => terminateChildProcess(child)).not.toThrow();
});
test("redacts asynchronous child errors and captured output", async () => {
  const child = childProcess();
  const promise = execute("node", [], { env: { SERVICE_TOKEN: "spawn-secret" } }, () => child);
  child.stdout.emit("data", "failure detail: spawn-secret");
  child.stderr.emit("data", "stderr detail");
  const error = new Error("spawn failed with spawn-secret");
  error.code = "ENOENT";
  child.emit("error", error);
  const safeError = await promise.catch((value) => value);
  expect(safeError.message).toBe("spawn failed with [REDACTED]");
  expect(safeError.code).toBe("ENOENT");
  expect(safeError.stdout).toBe("failure detail: [REDACTED]");
  expect(safeError.stderr).toBe("stderr detail");
  expect(`${safeError.stdout}${safeError.stderr}`).not.toContain("spawn-secret");
  child.stdout.emit("data", "late stdout");
  child.stderr.emit("data", "late stderr");
  expect(safeError.stdout).toBe("failure detail: [REDACTED]");
  expect(safeError.stderr).toBe("stderr detail");
});
test("keeps child error diagnostics visible after captured output reaches its byte limit", async () => {
  const child = childProcess();
  const promise = execute("node", [], { env: {} }, () => child);
  child.stdout.emit("data", "x".repeat(100_000));
  child.emit("error", new Error("actionable failure"));
  await expect(promise).rejects.toMatchObject({
    message: "actionable failure",
    stdout: "x".repeat(100_000),
  });
});
test("settles only once after asynchronous child errors", async () => {
  const child = childProcess();
  const promise = execute("node", [], {}, () => child);
  child.emit("error", new Error("spawn failed"));
  child.emit("error", new Error("late error"));
  child.emit("close", 1, null);
  await expect(promise).rejects.toThrow("spawn failed");
});
test("handles captured stream errors as controlled child failures", async () => {
  const child = childProcess();
  child.kill = jest.fn();
  const promise = execute("node", [], {}, () => child);
  child.stdout.emit("error", new Error("stdout failed"));
  await expect(promise).rejects.toThrow("stdout failed");
  expect(child.kill).toHaveBeenCalledTimes(1);
  child.stderr.emit("error", new Error("late stderr failure"));
});
test("terminates a child after an asynchronous error even when it never closes", async () => {
  const child = childProcess();
  Object.defineProperty(child, "kill", {
    get: () => {
      throw new Error("kill failed");
    },
  });
  const promise = execute("node", [], {}, () => child);
  expect(() => child.emit("error", new Error("spawn failed"))).not.toThrow();
  await expect(promise).rejects.toThrow("spawn failed");
});

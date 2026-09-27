import { expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { execute } from "../../src/checks/execute-child-process.mjs";

test("captures child-process output until it closes", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "close") {
      child.stdout.emit("data", "standard output");
      child.stderr.emit("data", "diagnostic output");
      handler(3, null);
    }
  });
  await expect(execute("npm", ["run", "build"], { cwd: "C:\\repo" }, () => child)).resolves.toEqual(
    { code: 3, signal: null, stdout: "standard output", stderr: "diagnostic output" },
  );
  expect(child.on).toHaveBeenCalledWith("error", expect.any(Function));
});

test("redacts configured credential values from the child environment", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], { env: { SERVICE_TOKEN: "opaque-value-123" } }, () => child);
  child.stdout.emit("data", "service output opaque-value-123");
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({ stdout: "service output [REDACTED]" });
});

test("redacts explicit secrets whose environment keys do not look sensitive", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], {
    env: { UNUSUAL_SETTING: "credential-value" },
    redactionSecrets: ["credential-value"],
  }, (_command, _args, options) => {
    expect(options).not.toHaveProperty("redactionSecrets");
    return child;
  });
  child.stdout.emit("data", "echo credential-value");
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({ stdout: "echo [REDACTED]" });
});

test("redacts inherited process credentials when no child environment is supplied", async () => {
  const previous = process.env.ELIWARE_TEST_INHERITED_TOKEN;
  process.env.ELIWARE_TEST_INHERITED_TOKEN = "inherited-secret-456";
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  try {
    const promise = execute("node", [], {}, () => child);
    child.stdout.emit("data", "output inherited-secret-456");
    child.emit("close", 0, null);
    await expect(promise).resolves.toMatchObject({ stdout: "output [REDACTED]" });
  } finally {
    if (previous === undefined) delete process.env.ELIWARE_TEST_INHERITED_TOKEN;
    else process.env.ELIWARE_TEST_INHERITED_TOKEN = previous;
  }
});

test("redacts a configured credential split across child output chunks", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], { env: { SERVICE_TOKEN: "opaque-value-123" } }, () => child);
  child.stdout.emit("data", "prefix opaque-value-");
  child.stdout.emit("data", "123 suffix");
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({
    stdout: "prefix [REDACTED] suffix",
  });
});

test("omits an incomplete credential suffix when the raw output limit cuts it", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const secret = "opaque-value-123";
  const rawLimit = 100_000 + Buffer.byteLength(secret);
  const promise = execute("node", [], { env: { SERVICE_TOKEN: secret } }, () => child);
  child.stdout.emit("data", Buffer.from("o".repeat(rawLimit - 4)));
  child.stdout.emit("data", Buffer.from(secret.slice(0, 4)));
  child.emit("close", 0, null);
  const result = await promise;
  expect(result.stdout).not.toContain(secret.slice(0, 4));
});

test("suppresses output when an environment credential exceeds the bounded capture size", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], { env: { SERVICE_TOKEN: "x".repeat(100_001) } }, () => child);
  child.stdout.emit("data", "possibly sensitive output");
  child.stderr.emit("data", "possibly sensitive diagnostic");
  child.emit("close", 0, null);
  await expect(promise).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("captures bounded stdout and stderr from a completed child", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", ["--version"], { cwd: "C:/repo" }, (command, args, options) => {
    expect(command).toBe("node");
    expect(args).toEqual(["--version"]);
    expect(options).toMatchObject({ cwd: "C:/repo", shell: false, stdio: ["ignore", "pipe", "pipe"] });
    return child;
  });
  child.stdout.emit("data", Buffer.from("output"));
  child.stderr.emit("data", Buffer.from("warning"));
  child.emit("close", 3, "SIGTERM");
  await expect(promise).resolves.toEqual({
    code: 3,
    signal: "SIGTERM",
    stdout: "output",
    stderr: "warning",
  });
});

test("does not permit callers to enable shell interpretation", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("tool", [], { shell: true }, (_command, _args, options) => {
    expect(options.shell).toBe(false);
    return child;
  });
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({ code: 0 });
});

test("handles output-less adapters, early errors, defaults, and the real adapter", async () => {
  const outputless = new EventEmitter();
  const completed = execute("tool", [], {}, () => outputless);
  outputless.emit("close", 0, null);
  outputless.emit("error", new Error("late error"));
  await expect(completed).resolves.toMatchObject({ code: 0, stdout: "", stderr: "" });

  const failedChild = new EventEmitter();
  const failed = execute("tool", [], null, () => failedChild);
  failedChild.emit("error", new Error("spawn failed"));
  failedChild.emit("close", 1, null);
  await expect(failed).rejects.toThrow("spawn failed");
  await expect(execute(process.execPath, ["-e", ""])).resolves.toMatchObject({ code: 0 });
});

test("redacts configured secrets from asynchronous and synchronous spawn failures", async () => {
  const options = { env: { SERVICE_TOKEN: "spawn-secret-value" } };
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const asynchronous = execute("node", [], options, () => child);
  child.emit("error", new Error("spawn failed with spawn-secret-value"));
  await expect(asynchronous).rejects.toThrow("spawn failed with [REDACTED]");
  await expect(execute("node", [], options, () => {
    throw new Error("adapter failed with spawn-secret-value");
  })).rejects.toThrow("adapter failed with [REDACTED]");
});

test("preserves spawn error metadata and handles nonstandard adapter failures", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const named = new Error("missing tool");
  named.name = "SystemError";
  named.code = "ENOENT";
  const eventFailure = execute("tool", [], {}, () => child);
  child.emit("error", named);
  await expect(eventFailure).rejects.toMatchObject({ name: "SystemError", code: "ENOENT" });

  await expect(execute("tool", [], {}, () => { throw "adapter failure"; })).rejects.toThrow("adapter failure");
  await expect(execute("tool", [], {}, () => { throw { message: "plain failure" }; })).rejects.toThrow("plain failure");
});

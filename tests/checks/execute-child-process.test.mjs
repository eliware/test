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
  await expect(execute("npm", ["run", "build"], { cwd: "C:\\repo" }, () => child)).resolves.toEqual({ code: 3, signal: null, stdout: "standard output", stderr: "diagnostic output" });
  expect(child.on).toHaveBeenCalledWith("error", expect.any(Function));
});

test("redacts common credential formats from captured output", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], {}, () => child);
  child.stdout.emit("data", 'password: "secret value" token=abc12345');
  child.stderr.emit("data", "Authorization: Bearer abcdefghijkl");
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({
    stdout: 'password: [REDACTED] token=[REDACTED]',
    stderr: "Authorization: Bearer [REDACTED]",
  });
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

test("captures bounded stdout and stderr from a completed child", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", ["--version"], { cwd: "C:/repo" }, (command, args, options) => {
    expect(command).toBe("node");
    expect(args).toEqual(["--version"]);
    expect(options).toMatchObject({ cwd: "C:/repo", stdio: ["ignore", "pipe", "pipe"] });
    return child;
  });
  child.stdout.emit("data", Buffer.from("output"));
  child.stderr.emit("data", Buffer.from("warning"));
  child.emit("close", 3, "SIGTERM");
  await expect(promise).resolves.toEqual({ code: 3, signal: "SIGTERM", stdout: "output", stderr: "warning" });
});

test("enforces one combined output budget across stdout and stderr", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("node", [], {}, () => child);
  child.stdout.emit("data", "o".repeat(100_000));
  child.stderr.emit("data", "e".repeat(100_000));
  child.emit("close", 0, null);
  const result = await promise;
  expect(result.stdout.length + result.stderr.length).toBeLessThanOrEqual(100_000);
});

test("handles process adapters without output streams and ignores late errors", async () => {
  const child = new EventEmitter();
  const result = execute("tool", [], {}, () => child);
  child.emit("close", 0, null);
  child.emit("error", new Error("late"));
  await expect(result).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("rejects an early process error and ignores a later close", async () => {
  const child = new EventEmitter();
  const result = execute("tool", [], {}, () => child);
  child.emit("error", new Error("spawn failed"));
  child.emit("close", 1, null);
  await expect(result).rejects.toThrow("spawn failed");
});

test("uses the real child-process adapter when no injector is supplied", async () => {
  await expect(execute(process.execPath, ["-e", ""], {})).resolves.toMatchObject({ code: 0 });
});

test("rejects when the child process cannot start", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("missing", [], {}, () => child);
  child.emit("error", new Error("spawn failed"));
  await expect(promise).rejects.toThrow("spawn failed");
});


test("captures child output and completion details", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("npm", ["pack"], { cwd: "C:\\repo" }, () => child);
  child.stdout.emit("data", Buffer.from("out"));
  child.stderr.emit("data", Buffer.from("err"));
  child.emit("close", 0, null);
  await expect(promise).resolves.toEqual({ code: 0, signal: null, stdout: "out", stderr: "err" });
});

test("rejects when npm cannot start", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const promise = execute("npm", [], {}, () => child);
  child.emit("error", new Error("npm unavailable"));
  await expect(promise).rejects.toThrow("npm unavailable");
});

test("rejects when the child process cannot start", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "error") handler(new Error("spawn failed"));
  });
  await expect(execute("npm", [], {}, () => child)).rejects.toThrow("spawn failed");
});

test("captures formatter output until the child process closes", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "close") {
      child.stdout.emit("data", "formatted output");
      child.stderr.emit("data", "formatter warning");
      handler(2, "SIGTERM");
    }
  });
  await expect(execute("node", [], { cwd: "C:\\repo" }, () => child)).resolves.toEqual({
    code: 2,
    signal: "SIGTERM",
    stdout: "formatted output",
    stderr: "formatter warning",
  });
});

test("rejects when the formatter child cannot start", async () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter(), on: jest.fn() };
  child.on.mockImplementation((event, handler) => {
    if (event === "error") handler(new Error("formatter spawn failed"));
  });
  await expect(execute("node", [], {}, () => child)).rejects.toThrow("formatter spawn failed");
});

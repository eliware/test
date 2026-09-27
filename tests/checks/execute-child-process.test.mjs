import { EventEmitter } from "node:events";
import { expect, test } from "@jest/globals";
import { execute } from "../../src/checks/execute-child-process.mjs";

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("spawns without shell interpretation and returns captured process results", async () => {
  const child = childProcess();
  const promise = execute("npm", ["run", "build"], { cwd: "C:\\repo", shell: true }, (
    command,
    args,
    options,
  ) => {
    expect(command).toBe("npm");
    expect(args).toEqual(["run", "build"]);
    expect(options).toMatchObject({
      cwd: "C:\\repo",
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return child;
  });
  child.stdout.emit("data", "standard output");
  child.stderr.emit("data", "diagnostic output");
  child.emit("close", 3, "SIGTERM");
  await expect(promise).resolves.toEqual({
    code: 3,
    signal: "SIGTERM",
    stdout: "standard output",
    stderr: "diagnostic output",
  });
});

test("redacts secrets from asynchronous child error events", async () => {
  const child = childProcess();
  const promise = execute("node", [], { env: { SERVICE_TOKEN: "spawn-secret" } }, () => child);
  const error = new Error("spawn failed with spawn-secret");
  error.code = "ENOENT";
  child.emit("error", error);
  await expect(promise).rejects.toMatchObject({
    message: "spawn failed with [REDACTED]",
    code: "ENOENT",
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

test("redacts output using configured secrets before returning it", async () => {
  const child = childProcess();
  const promise = execute("node", [], {
    env: { UNUSUAL_SETTING: "credential-value" },
    redactionSecrets: ["credential-value"],
  }, (_command, _args, options) => {
    expect(options).not.toHaveProperty("redactionSecrets");
    return child;
  });
  child.stdout.emit("data", "output credential-value");
  child.emit("close", 0, null);
  await expect(promise).resolves.toMatchObject({ stdout: "output [REDACTED]" });
});

test("handles synchronous spawn failures and children without output streams", async () => {
  await expect(execute("tool", [], null, () => {
    throw new Error("adapter failed");
  })).rejects.toThrow("adapter failed");

  const child = new EventEmitter();
  const result = execute("tool", [], {}, () => child);
  child.emit("close", 0, null);
  await expect(result).resolves.toEqual({
    code: 0,
    signal: null,
    stdout: "",
    stderr: "",
  });
});

test("uses default execution options and preserves diagnostics without redaction secrets", async () => {
  await expect(execute(process.execPath, ["-e", ""])).resolves.toMatchObject({ code: 0 });
  const child = childProcess();
  const promise = execute("tool", [], { env: {} }, () => child);
  child.emit("error", "adapter failure");
  await expect(promise).rejects.toMatchObject({ name: "Error", message: "adapter failure" });
});

import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../src/validation/shared/process/run-child.mjs";

test("spawns a child and returns captured process output", async () => {
  const output = [];
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('ok'); process.stderr.write('err')"], {
      onStdout: (value) => output.push(`out:${value}`),
      onStderr: (value) => output.push(`err:${value}`),
    }),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "ok", stderr: "err" });
  expect(output).toEqual(["out:ok", "err:err"]);
});

test("uses process defaults when options are omitted", async () => {
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('default')"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stdout: "default" }));
});

test("uses the default output bound for an invalid output limit", async () => {
  const child = new EventEmitter();
  const result = runChild("ignored", [], { maxOutputLength: 0, spawnProcess: () => child });
  child.emit("close", 0, null);
  await expect(result).resolves.toMatchObject({ code: 0, stdout: "", stderr: "" });
});

test("caps captured child output even when a larger limit is requested", async () => {
  const result = await runChild(
    process.execPath,
    ["-e", "process.stdout.write('x'.repeat(1_100_000))"],
    { maxOutputLength: 2_000_000 },
  );
  expect(result.stdout.length).toBeGreaterThan(0);
  expect(result.stdout.length).toBeLessThanOrEqual(1_000_000);
});

test("handles children without streams and ignores errors after close", async () => {
  const child = new EventEmitter();
  const result = runChild("ignored", [], { spawnProcess: () => child });
  child.emit("close", 0, null);
  child.emit("error", new Error("late child error"));
  await expect(result).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("forwards suite-end progress to the configured callback", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const onSuiteEnd = jest.fn();
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    progressPattern: /progress/u,
    onProgress() {
      this.onSuiteEnd("tests/example.test.mjs");
    },
    onSuiteEnd,
  });
  child.stderr.emit("data", "progress\n");
  child.emit("close", 0, null);
  await expect(result).resolves.toMatchObject({ code: 0 });
  expect(onSuiteEnd).toHaveBeenCalledWith("tests/example.test.mjs");
});

test("normalizes and redacts synchronous spawn failures before process setup", async () => {
  const createProgressTimeout = jest.fn();
  const result = runChild("ignored", [], {
    env: { API_TOKEN: "private-token-value" },
    spawnProcess: () => {
      throw new Error("spawn failed with private-token-value");
    },
    createProgressTimeout,
  });
  let error;
  try {
    await result;
  } catch (caught) {
    error = caught;
  }
  expect(error.message).toBe("spawn failed with [REDACTED]");
  expect(createProgressTimeout).not.toHaveBeenCalled();
});

test("normalizes non-Error synchronous spawn failures", async () => {
  await expect(
    runChild("ignored", [], {
      spawnProcess: () => {
        throw "launch failed";
      },
    }),
  ).rejects.toThrow("launch failed");
  await expect(
    runChild("ignored", [], {
      spawnProcess: () => {
        throw new Error("");
      },
    }),
  ).rejects.toThrow("Child process could not be started.");
});

test("terminates a spawned child when progress-timeout setup fails", async () => {
  const child = Object.assign(new EventEmitter(), { kill: jest.fn() });
  const terminateChild = jest.fn(() => true);

  await expect(
    runChild("ignored", [], {
      spawnProcess: () => child,
      createProgressTimeout: () => {
        throw new Error("timeout setup failed");
      },
      terminateChild,
    }),
  ).rejects.toThrow("timeout setup failed");

  expect(terminateChild).toHaveBeenCalledWith(
    child,
    process.platform,
    process.kill,
    undefined,
    process.env,
    "SIGTERM",
  );
  expect(child.kill).not.toHaveBeenCalled();
});

test("stops initialized timers when close-listener setup fails", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const registerListener = child.on.bind(child);
  child.on = (event, listener) => {
    if (event === "close") throw new Error("close listener setup failed");
    return registerListener(event, listener);
  };
  const stop = jest.fn();
  await expect(
    runChild("ignored", [], {
      spawnProcess: () => child,
      createProgressTimeout: () => ({ reset: jest.fn(), stop }),
      terminateChild: () => true,
    }),
  ).rejects.toThrow("close listener setup failed");
  expect(stop).toHaveBeenCalled();
});

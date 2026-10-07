import { expect, jest, test } from "@jest/globals";
import {
  createChildTerminator,
  terminateChild,
} from "../../../../src/validation/shared/process/terminate-child.mjs";

test("delegates Windows tree termination and falls back to signaling", () => {
  const child = { pid: 42, kill: jest.fn() };
  const killTree = jest.fn();
  expect(terminateChild(child, "win32", process.kill, killTree)).toBe(true);
  expect(killTree).toHaveBeenCalledWith(42, process.env);
  expect(terminateChild({ kill: jest.fn() }, "win32")).toBe(false);

  const fallbackChild = { pid: 42, kill: jest.fn() };
  expect(
    terminateChild(fallbackChild, "win32", process.kill, () => {
      throw new Error("failed");
    }),
  ).toBe(false);
  expect(fallbackChild.kill).toHaveBeenCalledWith("SIGTERM");
});

test("uses the configured Windows tree adapter when no call-specific adapter is supplied", () => {
  const killTree = jest.fn();
  const terminate = createChildTerminator(killTree);
  expect(terminate({ pid: 24, kill: jest.fn() }, "win32")).toBe(true);
  expect(killTree).toHaveBeenCalledWith(24, process.env);
});

test("uses the requested signal for process-group termination", () => {
  const killProcess = jest.fn();
  expect(
    terminateChild({ pid: 7, kill: jest.fn() }, "linux", killProcess, undefined, {}, "SIGKILL"),
  ).toBe(true);
  expect(killProcess).toHaveBeenCalledWith(-7, "SIGKILL");
});

test("falls back to child signaling when no POSIX process group exists", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill, pid: 0 }, "linux")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("falls back to child signaling when a POSIX process group is unavailable", () => {
  const killProcess = jest.fn(() => {
    throw new Error("missing");
  });
  const child = { kill: jest.fn(), pid: 123 };
  expect(terminateChild(child, "linux", killProcess)).toBe(true);
  expect(killProcess).toHaveBeenCalledWith(-123, "SIGTERM");
  expect(child.kill).toHaveBeenCalledWith("SIGTERM");
});

test("reports failure when POSIX process-group and child signaling both fail", () => {
  const child = {
    kill: () => {
      throw new Error("child signal failed");
    },
    pid: 123,
  };
  const killProcess = () => {
    throw new Error("group signal failed");
  };

  expect(terminateChild(child, "linux", killProcess)).toBe(false);
});

test("returns false when the child is invalid or direct signaling fails", () => {
  expect(terminateChild(null, "linux")).toBe(false);
  expect(
    terminateChild(
      {
        pid: 0,
        kill: () => {
          throw new Error("closed");
        },
      },
      "linux",
    ),
  ).toBe(false);
});

test("uses host defaults when platform arguments are omitted", () => {
  expect(terminateChild({ kill: jest.fn() })).toBe(process.platform !== "win32");
});

import { expect, jest, test } from "@jest/globals";
import { terminateChild } from "../../../../../src/checks/general/E-1/E-1.20/terminate-child.mjs";

test("uses Node's supported child termination on Windows", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill }, "win32")).toBe(true);
  expect(kill).toHaveBeenCalledWith();
});

test("falls back to terminating the child when no process group exists", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill, pid: 0 }, "linux")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("terminates a POSIX process group and falls back when the group is unavailable", () => {
  const kill = jest.spyOn(process, "kill").mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error("missing"); });
  try {
    const child = { kill: jest.fn(), pid: 123 };
    expect(terminateChild(child, "linux")).toBe(true);
    expect(kill).toHaveBeenCalledWith(-123, "SIGTERM");
    expect(terminateChild(child, "linux")).toBe(true);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  } finally {
    kill.mockRestore();
  }
});

test("handles an invalid child safely", () => {
  expect(terminateChild(null, "linux")).toBe(false);
});

import { expect, jest, test } from "@jest/globals";
import { terminateChildAfterSetupFailure } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/terminate-child-after-setup-failure.mjs";

test("uses the default terminator with the injected process killer", () => {
  const child = { pid: 42, kill: jest.fn() };
  const killProcess = jest.fn();
  terminateChildAfterSetupFailure(child, { terminationPlatform: "linux", killProcess }, {});
  expect(killProcess).toHaveBeenCalledWith(-42, "SIGTERM");
  expect(child.kill).not.toHaveBeenCalled();
});

test("uses the default terminator when none is injected", () => {
  const child = { kill: jest.fn() };
  terminateChildAfterSetupFailure(child, { terminationPlatform: "win32" }, {});
  expect(child.kill).toHaveBeenCalledWith("SIGTERM");
});

test("falls back to child kill when the configured terminator fails", () => {
  const child = { kill: jest.fn() };
  terminateChildAfterSetupFailure(child, { terminateChild: () => false }, {});
  expect(child.kill).toHaveBeenCalledWith("SIGTERM");
});

test("contains termination and fallback failures", () => {
  const child = {
    kill: () => {
      throw new Error("kill failure");
    },
  };
  terminateChildAfterSetupFailure(
    child,
    {
      terminateChild: () => {
        throw new Error("setup failure");
      },
    },
    {},
  );
  expect(() => terminateChildAfterSetupFailure(undefined, {}, {})).not.toThrow();
});

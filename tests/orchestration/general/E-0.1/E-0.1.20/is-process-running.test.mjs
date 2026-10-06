import { expect, jest, test } from "@jest/globals";
import { isProcessRunning } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/is-process-running.mjs";

test("detects running and missing processes", () => {
  expect(isProcessRunning(42, jest.fn())).toBe(true);
  const missing = Object.assign(new Error("missing"), { code: "ESRCH" });
  expect(
    isProcessRunning(
      42,
      jest.fn(() => {
        throw missing;
      }),
    ),
  ).toBe(false);
});

test("treats permission denial as a live process and propagates other failures", () => {
  const denied = Object.assign(new Error("denied"), { code: "EPERM" });
  expect(
    isProcessRunning(
      42,
      jest.fn(() => {
        throw denied;
      }),
    ),
  ).toBe(true);
  expect(() =>
    isProcessRunning(42, () => {
      throw new Error("probe failed");
    }),
  ).toThrow("probe failed");
});

test("uses process.kill as the default liveness probe", () => {
  const probe = jest.spyOn(process, "kill").mockImplementation(() => true);
  try {
    expect(isProcessRunning(42)).toBe(true);
    expect(probe).toHaveBeenCalledWith(42, 0);
  } finally {
    probe.mockRestore();
  }
});

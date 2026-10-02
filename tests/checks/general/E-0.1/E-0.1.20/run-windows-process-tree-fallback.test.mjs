import { expect, jest, test } from "@jest/globals";
import { runWindowsProcessTreeFallback } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-windows-process-tree-fallback.mjs";

const options = { timeout: 1_000, windowsHide: true, shell: false };

test("runs the Windows PowerShell process-tree fallback with a bounded environment", () => {
  const execute = jest.fn();
  runWindowsProcessTreeFallback(42, { SystemRoot: "C:/Windows" }, execute, options);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(execute.mock.calls[0][0]).toMatch(/WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/iu);
  expect(execute.mock.calls[0][1].at(-1)).toContain("Get-CimInstance Win32_Process");
  expect(execute.mock.calls[0][2]).toMatchObject({
    ...options,
    env: { ELIWARE_TEST_PROCESS_ID: "42" },
  });
});

test("falls back to PowerShell Core and aggregates both failures", () => {
  const execute = jest.fn().mockImplementationOnce(() => {
    throw new Error("Windows PowerShell unavailable");
  });
  runWindowsProcessTreeFallback(42, { SystemRoot: "C:/Windows" }, execute, options);
  expect(execute.mock.calls[1][0]).toBe("pwsh.exe");
  const fail = () =>
    runWindowsProcessTreeFallback(
      42,
      { SystemRoot: "C:/Windows" },
      () => {
        throw new Error("unavailable");
      },
      options,
    );
  expect(fail).toThrow(AggregateError);
});

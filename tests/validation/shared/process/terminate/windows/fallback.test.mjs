import { expect, jest, test } from "@jest/globals";
import { attemptWindowsProcessTreeFallbacks } from "../../../../../../src/validation/shared/process/terminate/windows/fallback.mjs";

const options = { windowsHide: true, stdio: "ignore", timeout: 1_000, shell: false };
const resolvePowerShellCore = () => "C:/Program Files/PowerShell/7/pwsh.exe";

test("tries PowerShell after taskkill fails and preserves fallback settings", () => {
  const calls = [];
  const execute = (command, args, commandOptions) => {
    calls.push({ command, args, options: commandOptions });
    if (calls.length === 1) throw new Error("taskkill unavailable");
  };
  const failure = attemptWindowsProcessTreeFallbacks(
    42,
    { SystemRoot: "C:/Windows" },
    execute,
    options,
    () => false,
    resolvePowerShellCore,
  );

  expect(failure).toBeInstanceOf(AggregateError);
  expect(failure.errors.map(({ message }) => message)).toEqual(["taskkill unavailable"]);
  expect(calls).toHaveLength(2);
  expect(calls[0].command).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(calls[0].args).toEqual(["/pid", "42", "/t", "/f"]);
  expect(calls[0].options).toMatchObject({ timeout: 1_000, windowsHide: true, shell: false });
  expect(calls[1].command).toMatch(/WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/iu);
  expect(calls[1].args.at(-1)).toContain("Get-CimInstance Win32_Process");
  expect(calls[1].options.env.ELIWARE_TEST_PROCESS_ID).toBe("42");
});

test("does not run a fallback after taskkill closes the process", () => {
  const execute = jest.fn();
  const failure = attemptWindowsProcessTreeFallbacks(
    42,
    { SystemRoot: "C:/Windows" },
    execute,
    options,
    () => true,
    resolvePowerShellCore,
  );
  expect(failure).toBeNull();
  expect(execute).toHaveBeenCalledTimes(1);
});

test("aggregates errors from taskkill and both PowerShell choices", () => {
  const execute = jest.fn(() => {
    throw new Error("command unavailable");
  });
  const failure = attemptWindowsProcessTreeFallbacks(
    42,
    { SystemRoot: "C:/Windows" },
    execute,
    options,
    () => false,
    resolvePowerShellCore,
  );
  expect(failure).toBeInstanceOf(AggregateError);
  expect(failure.errors).toHaveLength(2);
  expect(failure.errors[0].message).toBe("command unavailable");
  expect(failure.errors[1]).toBeInstanceOf(AggregateError);
  expect(failure.errors[1].errors).toHaveLength(2);
  expect(execute).toHaveBeenCalledTimes(3);
});

import { expect, jest, test } from "@jest/globals";
import { checkNpmVersion } from "../../src/cli/check-npm-version.mjs";

function executeWith(error, output) {
  return jest.fn((command, args, options, callback) => {
    callback(error, output);
  });
}

test("accepts npm 12 and later from the resolved npm command", async () => {
  const executeProcess = executeWith(null, "12.0.0\n");
  await expect(checkNpmVersion({ executeProcess, platform: "linux", env: {} })).resolves.toBeNull();
  expect(executeProcess).toHaveBeenCalledWith(
    "npm",
    ["--version"],
    expect.objectContaining({ encoding: "utf8" }),
    expect.any(Function),
  );
});

test("uses the active npm_execpath on Windows instead of a shell lookup", async () => {
  const executeProcess = executeWith(null, "12.2.0");
  const env = { npm_execpath: "C:\\npm\\npm-cli.js", PATH: "C:\\tools" };
  await expect(
    checkNpmVersion({
      executeProcess,
      platform: "win32",
      env,
      workingDirectory: "C:\\repo",
      execPath: "C:\\node.exe",
      fileExists: (path) => path === env.npm_execpath,
    }),
  ).resolves.toBeNull();
  expect(executeProcess).toHaveBeenCalledWith(
    "C:\\node.exe",
    ["C:\\npm\\npm-cli.js", "--version"],
    expect.objectContaining({ cwd: "C:\\repo", env }),
    expect.any(Function),
  );
});

test("uses the Windows PATH npm when no npm_execpath is present", async () => {
  const executeProcess = executeWith(null, "12.2.0");
  const env = { PATH: "C:\\tools;D:\\npm-tools" };
  await expect(
    checkNpmVersion({
      executeProcess,
      platform: "win32",
      env,
      workingDirectory: "C:\\repo",
      execPath: "C:\\Program Files\\nodejs\\node.exe",
    }),
  ).resolves.toBeNull();
  expect(executeProcess).toHaveBeenCalledWith(
    "cmd.exe",
    ["/d", "/s", "/c", "npm", "--version"],
    expect.objectContaining({ cwd: "C:\\repo", env }),
    expect.any(Function),
  );
});

test("rejects npm versions older than 12", async () => {
  await expect(
    checkNpmVersion({ executeProcess: executeWith(null, "11.9.0"), env: {} }),
  ).resolves.toBe("npm 12 or later is required for validation; found npm 11.9.0.");
});

test.each(["", "unknown", "12", "12.0.0 extra"])(
  "rejects malformed npm version output %j",
  async (output) => {
    await expect(
      checkNpmVersion({ executeProcess: executeWith(null, output), env: {} }),
    ).resolves.toBe("Cannot determine the active npm version; npm 12 or later is required.");
  },
);

test("reports when the npm version process cannot be resolved or run", async () => {
  await expect(
    checkNpmVersion({ executeProcess: executeWith(new Error("npm missing"), ""), env: {} }),
  ).resolves.toBe("Cannot determine the active npm version; npm 12 or later is required.");
});

test("checks the active npm executable by default", async () => {
  const diagnostic = await checkNpmVersion();
  expect(
    diagnostic === null ||
      diagnostic.startsWith("npm 12 or later is required for validation; found npm "),
  ).toBe(true);
});

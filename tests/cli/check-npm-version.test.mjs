import { expect, test } from "@jest/globals";
import { checkNpmVersion } from "../../src/cli/check-npm-version.mjs";

function executeWith(error, output, platform = process.platform) {
  return (command, args, options, callback) => {
    const windows = platform === "win32";
    expect(command).toBe(windows ? "cmd.exe" : "npm");
    expect(args).toEqual(windows ? ["/d", "/s", "/c", "npm --version"] : ["--version"]);
    expect(options).toEqual({ encoding: "utf8", windowsHide: true });
    callback(error, output);
  };
}

test("accepts npm 12 and later", async () => {
  await expect(checkNpmVersion(executeWith(null, "12.0.0\n"))).resolves.toBeNull();
  await expect(checkNpmVersion(executeWith(null, "13.2.1"))).resolves.toBeNull();
  await expect(checkNpmVersion(executeWith(null, "12.0.0", "linux"), "linux")).resolves.toBeNull();
  await expect(checkNpmVersion(executeWith(null, "12.0.0", "win32"), "win32")).resolves.toBeNull();
});

test("rejects npm versions older than 12", async () => {
  await expect(checkNpmVersion(executeWith(null, "11.9.0"))).resolves.toBe(
    "npm 12 or later is required for validation; found npm 11.9.0.",
  );
});

test.each(["", "unknown", "12", "12.0.0 extra"])(
  "rejects malformed npm version output %j",
  async (output) => {
    await expect(checkNpmVersion(executeWith(null, output))).resolves.toBe(
      "Cannot determine the active npm version; npm 12 or later is required.",
    );
  },
);

test("reports when the npm version process fails", async () => {
  await expect(checkNpmVersion(executeWith(new Error("npm missing"), ""))).resolves.toBe(
    "Cannot determine the active npm version; npm 12 or later is required.",
  );
});

test("checks the active npm executable by default", async () => {
  const diagnostic = await checkNpmVersion();
  expect(
    diagnostic === null ||
      diagnostic.startsWith("npm 12 or later is required for validation; found npm "),
  ).toBe(true);
});

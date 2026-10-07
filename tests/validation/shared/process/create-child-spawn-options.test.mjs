import { expect, test } from "@jest/globals";
import { createChildSpawnOptions } from "../../../../src/validation/shared/process/create-child-spawn-options.mjs";

test("builds isolated child process options from the requested environment", () => {
  const env = { TOKEN: "redacted-value" };
  expect(createChildSpawnOptions({ cwd: "/repo" }, env)).toEqual({
    cwd: "/repo",
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    detached: process.platform !== "win32",
  });
  expect(createChildSpawnOptions({ terminationPlatform: "win32" }, env).detached).toBe(false);
});

import { expect, jest, test } from "@jest/globals";
import { packageJson } from "../../../../../test-fixtures/helpers/smoke-package.mjs";
import { runSmokeConsumerTest } from "../../../../../src/validation/stages/smoke/install-smoke-candidate/consumer-test.mjs";

const options = (run) => ({
  targetRoot: "C:/consumer",
  packageJson,
  run,
  command: "npm",
  prefix: ["--prefix"],
  env: { PATH: "path" },
});

test("runs consumer npm test with the smoke candidate marker", async () => {
  const run = jest.fn(async () => ({ code: 0 }));
  await expect(runSmokeConsumerTest(options(run))).resolves.toBeUndefined();
  expect(run).toHaveBeenCalledWith("npm", ["--prefix", "test"], {
    cwd: "C:/consumer",
    env: { PATH: "path", ELIWARE_TEST_SMOKE_CANDIDATE: packageJson.name },
  });
});

test("rejects a changed target before running consumer npm test", async () => {
  const run = jest.fn();
  const assertTargetIdentity = jest.fn(async () => {
    throw new Error("target changed");
  });

  await expect(runSmokeConsumerTest({ ...options(run), assertTargetIdentity })).rejects.toThrow(
    "target changed",
  );
  expect(run).not.toHaveBeenCalled();
});

test.each([
  [{ code: 1, stdout: "test failed" }, "Consumer npm test failed: test failed"],
  [{ code: 1 }, "Consumer npm test failed."],
])("reports consumer test failures with available output %#", async (result, message) => {
  await expect(runSmokeConsumerTest(options(async () => result))).rejects.toThrow(message);
});

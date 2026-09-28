import { expect, test } from "@jest/globals";
import { createJestCheckOptions } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-check-options.mjs";

test("creates the execution options for a Jest check", () => {
  const onTimeout = () => {};
  const writeOutput = () => {};
  const env = { TOKEN: "configured" };

  expect(createJestCheckOptions({ writeOutput, env }, onTimeout)).toEqual({
    onStderr: writeOutput,
    onTimeout,
    retainCoverageDirectory: true,
    env,
  });
});

test("defaults the Jest environment to the current process environment", () => {
  expect(createJestCheckOptions({}, () => {}).env).toBe(process.env);
});

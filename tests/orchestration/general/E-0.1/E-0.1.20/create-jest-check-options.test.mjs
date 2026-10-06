import { expect, jest, test } from "@jest/globals";
import { createJestCheckOptions } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/create-jest-check-options.mjs";

test("creates the execution options for a Jest check", () => {
  const onTimeout = () => {};
  const env = { TOKEN: "configured" };

  const options = createJestCheckOptions({ env }, onTimeout);
  expect(options).toEqual({
    onTimeout,
    retainCoverageDirectory: true,
    env,
    writeOutput: undefined,
    beginNestedOutput: expect.any(Function),
  });
  expect(() => options.beginNestedOutput()).not.toThrow();
});

test("defaults the Jest environment to the current process environment", () => {
  expect(createJestCheckOptions({}, () => {}).env).toBe(process.env);
});

test("passes the timing output writer into Jest progress handling", () => {
  const writeOutput = () => {};
  const writeNestedOutput = jest.fn();
  const beginNestedOutput = jest.fn();
  const options = createJestCheckOptions(
    {
      writeOutput,
      timing: { beginNestedOutput, writeNestedOutput },
    },
    () => {},
  );
  expect(options.writeOutput).toBe(writeNestedOutput);
  options.beginNestedOutput();
  expect(beginNestedOutput).toHaveBeenCalledTimes(1);
});

test("uses the context writer when timing helpers are unavailable", () => {
  const writeOutput = () => {};
  const options = createJestCheckOptions({ writeOutput }, () => {});
  expect(options.writeOutput).toBe(writeOutput);
});

import { expect, jest, test } from "@jest/globals";
import { recordJestContext } from "../../../../../src/checks/general/E-0.1/E-0.1.20/record-jest-context.mjs";

test("records Jest output and timing context", () => {
  const setJestOutputGetter = jest.fn();
  const context = { timing: { setJestOutputGetter } };
  const result = { code: 0, stdout: "ok", stderr: "" };
  expect(recordJestContext(context, result)).toBe(context);
  expect(context.jestResult).toBe(result);
  expect(setJestOutputGetter.mock.calls[0][0]()).toBe("ok");
});

test("uses the lazy timing output handoff when supported", () => {
  const setJestOutputGetter = jest.fn();
  const context = { timing: { setJestOutputGetter } };
  const result = { code: 0, stdout: "ordinary output", stderr: '{"numFailedTestSuites":0}' };
  recordJestContext(context, result);
  expect(setJestOutputGetter).toHaveBeenCalledTimes(1);
  expect(setJestOutputGetter.mock.calls[0][0]()).toBe(result.stderr);
});

test("falls back to stderr when Jest writes its timing JSON there", () => {
  const setJestOutputGetter = jest.fn();
  const context = { timing: { setJestOutputGetter } };
  const result = { code: 0, stdout: "", stderr: "{\"numFailedTestSuites\":0}" };

  recordJestContext(context, result);

  expect(setJestOutputGetter.mock.calls[0][0]()).toBe(result.stderr);
});

test("supplies an empty timing input when neither output stream has data", () => {
  const setJestOutputGetter = jest.fn();
  recordJestContext({ timing: { setJestOutputGetter } }, { stdout: "", stderr: "" });

  expect(setJestOutputGetter.mock.calls[0][0]()).toBe("");
});

test("records the result when timing is unavailable", () => {
  const result = { code: 0, stdout: "plain", stderr: "" };
  expect(recordJestContext({}, result).jestResult).toBe(result);
});

import { expect, jest, test } from "@jest/globals";
import { recordJestContext } from "../../../../../src/checks/general/E-1/E-1.20/record-jest-context.mjs";

test("records Jest output and timing context", () => {
  const setJestOutput = jest.fn();
  const context = { timing: { setJestOutput } };
  const result = { code: 0, stdout: "ok", stderr: "" };
  expect(recordJestContext(context, result)).toBe(context);
  expect(context.jestResult).toBe(result);
  expect(setJestOutput).toHaveBeenCalledWith("ok");
});

test("uses the lazy timing output handoff when supported", () => {
  const setJestOutputGetter = jest.fn();
  const context = { timing: { setJestOutputGetter } };
  const result = { code: 0, stdout: "lazy", stderr: "" };
  recordJestContext(context, result);
  expect(setJestOutputGetter).toHaveBeenCalledTimes(1);
  expect(setJestOutputGetter.mock.calls[0][0]()).toBe("lazy");
});

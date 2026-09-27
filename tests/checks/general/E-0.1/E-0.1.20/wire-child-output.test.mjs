import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { wireChildOutput } from "../../../../../src/checks/general/E-0.1/E-0.1.20/wire-child-output.mjs";

test("forwards stdout and stderr to their owning handlers and flushes them", () => {
  const child = { stdout: new EventEmitter(), stderr: new EventEmitter() };
  const output = { stdout: jest.fn(), stderr: jest.fn(), flush: jest.fn() };
  const progress = { push: jest.fn(), flush: jest.fn() };
  const flush = wireChildOutput(child, output, progress);

  child.stdout.emit("data", "out");
  child.stderr.emit("data", "err");
  flush();

  expect(output.stdout).toHaveBeenCalledWith("out");
  expect(progress.push).toHaveBeenCalledWith("err");
  expect(output.stderr).toHaveBeenCalledWith("err");
  expect(output.flush).toHaveBeenCalledTimes(1);
  expect(progress.flush).toHaveBeenCalledTimes(1);
});

test("supports a child without piped streams", () => {
  const output = { stdout: jest.fn(), stderr: jest.fn(), flush: jest.fn() };
  const progress = { push: jest.fn(), flush: jest.fn() };
  const flush = wireChildOutput({}, output, progress);

  expect(() => flush()).not.toThrow();
  expect(output.flush).toHaveBeenCalledTimes(1);
  expect(progress.flush).toHaveBeenCalledTimes(1);
});

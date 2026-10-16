import { expect, jest, test } from "@jest/globals";
import { createChildOutputStream } from "../../../../../src/validation/shared/process/create-child/output-stream.mjs";

test("streams output within its configured bound", () => {
  const onStdout = jest.fn();
  const onStderr = jest.fn();
  const stream = createChildOutputStream({ onStdout, onStderr }, 5);
  stream.stdout("abc");
  stream.stderr("def");
  stream.stdout("ignored");
  expect([...onStdout.mock.calls.flat(), ...onStderr.mock.calls.flat()]).toEqual(["abc", "de"]);
});

test("does not emit a partial Unicode surrogate pair", () => {
  const callback = jest.fn();
  createChildOutputStream({ onStdout: callback }, 1).stdout("😀");
  expect(callback).not.toHaveBeenCalled();
});

test("skips empty output and disabled callbacks", () => {
  const callback = jest.fn();
  const stream = createChildOutputStream({ onStdout: callback }, 5);
  stream.stdout("");
  stream.stderr("text");
  expect(callback).not.toHaveBeenCalled();
});

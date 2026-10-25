import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  collectFileHandles,
  collectMockedHandles,
} from "../../../../../src/validation/harness/test-write-policy/collect/file-handles.mjs";

test("collects file handle bindings from functions and variables", () => {
  const ast = parse(
    "function save(handle) {} const write = (fileHandle) => fileHandle; const handle = open(); const stream = open(); function destructure({ handle }) {}",
  );
  expect(collectFileHandles(ast)).toEqual(new Set(["handle", "fileHandle"]));
});

test("collects mocked write methods and write spies", () => {
  const ast = parse(
    'const handle = { write: jest.fn() }; const fileHandle = { ["writeFile"]: jest.fn() }; const other = { read: jest.fn() }; jest.spyOn(handle, "writeFile"); jest.spyOn(fileHandle, "read");',
  );
  expect(collectMockedHandles(ast)).toEqual(new Set(["handle", "fileHandle"]));
});

test("ignores non-handle bindings and unrelated calls", () => {
  const ast = parse(
    'const stream = { write: jest.fn() }; jest.spyOn(stream, "write"); jest.spyOn(handle, "read");',
  );
  expect(collectFileHandles(ast)).toEqual(new Set());
  expect(collectMockedHandles(ast)).toEqual(new Set());
});

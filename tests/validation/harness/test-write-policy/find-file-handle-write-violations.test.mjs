import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findFileHandleWriteViolations } from "../../../../src/validation/harness/test-write-policy/find-file-handle-write-violations.mjs";

test("finds write calls on injected file handles", () => {
  const ast = parse("async function save(fileHandle) { await fileHandle.writeFile('x'); }");
  expect(findFileHandleWriteViolations(ast, "tests/example.test.mjs", new Set())).toEqual([
    "tests/example.test.mjs:1 uses a test API that creates files or temporary directories: use of writeFile.",
  ]);
});

test("allows mocked file handles and mocked file system modules", () => {
  const ast = parse(
    'const fileHandle = { write: jest.fn() }; fileHandle.write("x"); const handle = createHandle(); async function save(handle) { handle.writeFile("x"); stream.write("x"); }',
  );
  expect(
    findFileHandleWriteViolations(ast, "tests/example.test.mjs", new Set(["node:fs"])),
  ).toEqual([]);
  const spy = parse('function save(handle) { jest.spyOn(handle, "write"); handle.write("x"); }');
  expect(findFileHandleWriteViolations(spy, "tests/example.test.mjs", new Set())).toEqual([]);
  const ignoredSpy = parse(
    'function save(handle) { jest.spyOn(handle, "read"); handle.write("x"); }',
  );
  expect(findFileHandleWriteViolations(ignoredSpy, "tests/example.test.mjs", new Set())).toEqual([
    "tests/example.test.mjs:1 uses a test API that creates files or temporary directories: use of write.",
  ]);
  const readMock = parse('const fileHandle = { read: jest.fn() }; fileHandle.write("x");');
  expect(findFileHandleWriteViolations(readMock, "tests/example.test.mjs", new Set())).toHaveLength(
    1,
  );
  const computedMock = parse('const fileHandle = { ["write"]: jest.fn() }; fileHandle.write("x");');
  expect(findFileHandleWriteViolations(computedMock, "tests/example.test.mjs", new Set())).toEqual(
    [],
  );
  const pattern = parse("function save({ handle }) { return handle; }");
  expect(findFileHandleWriteViolations(pattern, "tests/example.test.mjs", new Set())).toEqual([]);
});

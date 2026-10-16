import { expect, test } from "@jest/globals";
import { findTestWritePolicyViolations } from "../../../../src/validation/harness/test-write-policy/scan-source.mjs";

test("finds named write and temporary directory imports", () => {
  const source =
    'import { writeFile as save, mkdtemp } from "node:fs/promises";\nimport { tmpdir } from "node:os";';
  expect(findTestWritePolicyViolations(source, "tests/example.test.mjs")).toEqual([
    "tests/example.test.mjs:1 uses a test API that creates files or temporary directories: import of writeFile.",
    "tests/example.test.mjs:1 uses a test API that creates files or temporary directories: import of mkdtemp.",
    "tests/example.test.mjs:2 uses a test API that creates files or temporary directories: import of tmpdir.",
  ]);
});

test("finds writes through namespace imports and dynamic module access", () => {
  const source = [
    'import * as fs from "node:fs/promises";',
    "await fs.promises.writeFile('file', 'text');",
    "const fileSystem = await import('node:fs');",
    "fileSystem.writeFile('file', 'text');",
    "const operatingSystem = require('node:os');",
    "operatingSystem.tmpdir();",
    "const { writeFile: save } = await import('node:fs/promises');",
    "save('file', 'text');",
    "fileSystem?.writeFile('file', 'text');",
    "fileSystem['writeFile']('file', 'text');",
  ].join("\n");
  expect(findTestWritePolicyViolations(source, "tests/example.test.mjs")).toEqual([
    "tests/example.test.mjs:2 uses a test API that creates files or temporary directories: use of writeFile.",
    "tests/example.test.mjs:4 uses a test API that creates files or temporary directories: use of writeFile.",
    "tests/example.test.mjs:6 uses a test API that creates files or temporary directories: use of tmpdir.",
    "tests/example.test.mjs:7 uses a test API that creates files or temporary directories: binding of writeFile.",
    "tests/example.test.mjs:9 uses a test API that creates files or temporary directories: use of writeFile.",
    "tests/example.test.mjs:10 uses a test API that creates files or temporary directories: use of writeFile.",
  ]);
});

test("allows read-only APIs and ignores strings and comments", () => {
  const source = [
    'import { readFile, readdir } from "node:fs/promises";',
    "// writeFile('ignored', 'text')",
    'const message = "tmpdir()";',
    "await readFile('README.md');",
    "await readdir('src');",
  ].join("\n");
  expect(findTestWritePolicyViolations(source, "tests/example.test.mjs")).toEqual([]);
});

test("finds computed temporary bindings and ignores computed read bindings", () => {
  const source = [
    "const { ['tmpdir']: getTemp } = await import('node:os');",
    "const { ['readFile']: read } = await import('node:fs/promises');",
    "getTemp();",
    "read('file');",
  ].join("\n");
  expect(findTestWritePolicyViolations(source, "tests/example.test.mjs")).toEqual([
    "tests/example.test.mjs:1 uses a test API that creates files or temporary directories: binding of tmpdir.",
  ]);
});

test("ignores member calls without a namespace identifier", () => {
  expect(
    findTestWritePolicyViolations("this.writeFile('file', 'text');", "tests/example.test.mjs"),
  ).toEqual([]);
});

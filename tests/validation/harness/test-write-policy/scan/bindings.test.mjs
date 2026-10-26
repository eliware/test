import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectFilesystemBindings } from "../../../../../src/validation/harness/test-write-policy/scan/bindings.mjs";

function parseSource(source) {
  return parse(source, { sourceType: "unambiguous", plugins: ["jsx", "typescript"] });
}

test("collects namespace imports and chained namespace aliases", () => {
  const { namespaceBindings } = collectFilesystemBindings(
    parseSource('import * as fs from "node:fs"; const io = fs; const fileSystem = io;'),
  );
  expect([...namespaceBindings]).toEqual(["fs", "io", "fileSystem"]);
});

test("collects imported and dynamically destructured restricted bindings", () => {
  const { restrictedBindings } = collectFilesystemBindings(
    parseSource(
      'import { writeFile as save } from "node:fs/promises"; const { mkdtemp } = require("node:fs/promises");',
    ),
  );
  expect(restrictedBindings.map(({ name, type }) => ({ name, type }))).toEqual([
    { name: "writeFile", type: "import" },
    { name: "mkdtemp", type: "binding" },
  ]);
});

test("does not collect dynamic bindings for mocked modules", () => {
  const { namespaceBindings, restrictedBindings } = collectFilesystemBindings(
    parseSource('jest.mock("node:fs"); const fs = await import("node:fs");'),
  );
  expect([...namespaceBindings]).toEqual([]);
  expect(restrictedBindings).toEqual([]);
});

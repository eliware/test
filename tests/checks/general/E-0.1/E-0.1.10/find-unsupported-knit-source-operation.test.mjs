import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { hasUnsupportedKnitSourceOperation } from "../../../../../src/checks/general/E-0.1/E-0.1.10/find-unsupported-knit-source-operation.mjs";

function detects(source, bindings = { namespaces: new Set(), importedOperations: new Set() }) {
  return hasUnsupportedKnitSourceOperation(
    parse(source, { sourceType: "module" }).program,
    bindings,
  );
}

test("detects dangerous imported functions, globals, and member operations", () => {
  expect(
    detects("remove()", { namespaces: new Set(), importedOperations: new Set(["remove"]) }),
  ).toBe(true);
  expect(detects("fetch('https://example.test')")).toBe(true);
  expect(detects("exit()")).toBe(true);
  expect(detects("request()")).toBe(true);
  expect(detects("process.exit(1)")).toBe(true);
  expect(detects("process?.exit(1)")).toBe(true);
  expect(detects("globalThis['fetch']('https://example.test')")).toBe(true);
  expect(
    detects("fs.rm('output')", { namespaces: new Set(["fs"]), importedOperations: new Set() }),
  ).toBe(true);
  expect(detects("process[operation]()")).toBe(true);
});

test("allows ordinary calls and terminates on cyclic trees", () => {
  expect(detects("object.run(); process.cwd(); globalThis.location(); object[operation]();")).toBe(
    false,
  );
  const cyclic = { type: "Program", body: [] };
  cyclic.body.push(cyclic);
  expect(
    hasUnsupportedKnitSourceOperation(cyclic, {
      namespaces: new Set(),
      importedOperations: new Set(),
    }),
  ).toBe(false);
  expect(
    hasUnsupportedKnitSourceOperation(null, {
      namespaces: new Set(),
      importedOperations: new Set(),
    }),
  ).toBe(false);
});

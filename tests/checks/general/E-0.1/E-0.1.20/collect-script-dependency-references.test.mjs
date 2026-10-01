import { expect, test } from "@jest/globals";
import { collectScriptReferences } from "../../../../../src/checks/general/E-0.1/E-0.1.20/collect-script-dependency-references.mjs";

test("collects dependency names from scripts and ignores non-string scripts", () => {
  const referenced = new Set();
  collectScriptReferences(undefined, ["a.b"], referenced);
  collectScriptReferences(
    { alpha: "alpha --flag", beta: "run 'beta/subpath'", noMatch: "alphabet", ignored: null },
    ["alpha", "beta"],
    referenced,
  );
  expect([...referenced].sort()).toEqual(["alpha", "beta"]);
});

test("maps declared package executables used as npm script commands", () => {
  const referenced = new Set();
  collectScriptReferences(
    { test: "eliware-test", typecheck: "tsc --noEmit", unrelated: "echo tsc" },
    ["@eliware/test", "typescript"],
    referenced,
    new Map([
      ["eliware-test", "@eliware/test"],
      ["tsc", "typescript"],
    ]),
  );
  expect([...referenced].sort()).toEqual(["@eliware/test", "typescript"]);
});

test("maps package binaries invoked through node_modules/.bin paths", () => {
  const referenced = new Set();
  collectScriptReferences(
    {
      posix: "node node_modules/.bin/vyops preflight config.boot",
      relative: 'node "./node_modules/.bin/vyops" preflight config.boot',
      windows: "node C:\\repo\\node_modules\\.bin\\vyops.cmd preflight config.boot",
      unrelated: "node node_modules/.bin/vyops-extra preflight",
    },
    [],
    referenced,
    new Map([["vyops", "@eliware/vyops"]]),
  );
  expect([...referenced]).toEqual(["@eliware/vyops"]);
});

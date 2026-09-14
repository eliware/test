import { expect, test } from "@jest/globals";
import { collectScriptReferences } from "../../../../../src/checks/general/E-1/E-1.20/collect-script-dependency-references.mjs";

test("collects dependency names from scripts and ignores non-string scripts", () => {
  const referenced = new Set();
  collectScriptReferences(undefined, ["a.b"], referenced);
  collectScriptReferences({ alpha: "alpha --flag", beta: "run 'beta/subpath'", noMatch: "alphabet", ignored: null }, ["alpha", "beta"], referenced);
  expect([...referenced].sort()).toEqual(["alpha", "beta"]);
});

import { expect, test } from "@jest/globals";
import { collectStructuredValues } from "../../../../../src/checks/general/E-1/E-1.20/collect-structured-dependency-references.mjs";

test("collects dependency references from structured values", () => {
  const referenced = new Set();
  collectStructuredValues({ command: "beta --flag" }, ["alpha", "beta"], referenced);
  expect([...referenced]).toEqual(["beta"]);
  collectStructuredValues(["alpha", "beta/subpath", { nested: "run gamma --flag" }, 42, null], ["alpha", "beta", "gamma", "delta"], referenced);
  expect([...referenced].sort()).toEqual(["alpha", "beta", "gamma"]);
  collectStructuredValues(false, ["epsilon"], referenced);
});

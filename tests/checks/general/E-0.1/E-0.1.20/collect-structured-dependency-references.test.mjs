import { expect, test } from "@jest/globals";
import { collectStructuredValues } from "../../../../../src/checks/general/E-0.1/E-0.1.20/collect-structured-dependency-references.mjs";

test("collects dependency references from structured values", () => {
  const referenced = new Set();
  collectStructuredValues({ command: "beta --flag" }, ["alpha", "beta"], referenced);
  expect([...referenced]).toEqual(["beta"]);
  collectStructuredValues(
    ["alpha", "beta/subpath", { command: "run gamma --flag" }, 42, null],
    ["alpha", "beta", "gamma", "delta"],
    referenced,
  );
  expect([...referenced].sort()).toEqual(["beta", "gamma"]);
  collectStructuredValues(false, ["epsilon"], referenced);
});

test("ignores documentation and arbitrary metadata strings", () => {
  const referenced = new Set();
  collectStructuredValues(
    { description: "alpha beta", notes: ["gamma"], scripts: { test: "beta --run" } },
    ["alpha", "beta", "gamma"],
    referenced,
  );
  expect([...referenced]).toEqual(["beta"]);
});

test("counts package entrypoint and export metadata as dependency references", () => {
  const referenced = new Set();
  collectStructuredValues(
    {
      main: "runtime-entry",
      module: "module-entry",
      exports: { ".": { import: "export-entry" } },
      files: ["package-entry"],
    },
    ["runtime-entry", "module-entry", "export-entry", "package-entry"],
    referenced,
  );
  expect([...referenced].sort()).toEqual([
    "export-entry",
    "module-entry",
    "package-entry",
    "runtime-entry",
  ]);
});

import { expect, test } from "@jest/globals";
import { collectStructuredReferences } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/collect-structured-references.mjs";

test("collects structured paths without treating commands as references", () => {
  const document = {
    crosslinks: [{ path: "../docs/authority-map.json" }],
    implementation: { source: ["src/index.mjs"] },
    verification: { tests: ["tests/index.test.mjs"], commands: ["npm test"] },
  };
  const references = collectStructuredReferences(document, "specs/contracts.json");
  expect(references.map(({ value }) => value)).toEqual([
    "../docs/authority-map.json",
    "src/index.mjs",
    "tests/index.test.mjs",
  ]);
});

test("reports crosslink objects without machine-followable paths", () => {
  const references = collectStructuredReferences(
    { crosslinks: [{ relation: "missing-path" }] },
    "specs/source.json",
  );
  expect(references).toEqual([
    {
      error: "crosslinks[0] must be an object with a path",
      file: "specs/source.json",
      field: "crosslinks",
    },
  ]);
});

test("walks arrays and records only valid structured reference values", () => {
  const references = collectStructuredReferences(
    {
      crosslinks: [null, "not-an-object", { path: 7 }, { path: "./valid.json" }],
      globalAuthorityMap: ["../authority.json", 42],
      implementation: {
        source: ["src/a.mjs", 7],
        tests: "tests/a.test.mjs",
        files: ["README.md"],
        documents: ["docs/README.md"],
        references: ["specs/contracts.json"],
      },
      evidence: { source: ["evidence.json"] },
      nested: [null, "scalar", { ignored: true }],
    },
    "specs/input.json",
  );
  expect(references).toEqual([
    {
      error: "crosslinks[0] must be an object with a path",
      file: "specs/input.json",
      field: "crosslinks",
    },
    {
      error: "crosslinks[1] must be an object with a path",
      file: "specs/input.json",
      field: "crosslinks",
    },
    {
      error: "crosslinks[2] must be an object with a path",
      file: "specs/input.json",
      field: "crosslinks",
    },
    { value: "./valid.json", file: "specs/input.json", field: "path", external: true },
    { value: "../authority.json", file: "specs/input.json", field: "globalAuthorityMap", external: true },
    { value: "src/a.mjs", file: "specs/input.json", field: "implementation.source", external: false },
    { value: "tests/a.test.mjs", file: "specs/input.json", field: "implementation.tests", external: false },
    { value: "README.md", file: "specs/input.json", field: "implementation.files", external: false },
    { value: "docs/README.md", file: "specs/input.json", field: "implementation.documents", external: false },
    { value: "specs/contracts.json", file: "specs/input.json", field: "implementation.references", external: false },
    { value: "evidence.json", file: "specs/input.json", field: "evidence.source", external: false },
  ]);
});

test("handles primitive and empty documents and registers only valid crosslinks", () => {
  expect(collectStructuredReferences(null, "empty.json")).toEqual([]);
  expect(collectStructuredReferences([null, 1, "text"], "array.json")).toEqual([]);
});

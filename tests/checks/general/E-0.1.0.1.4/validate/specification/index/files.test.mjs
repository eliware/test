import { expect, test } from "@jest/globals";
import { inspectSpecificationIndexFiles } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/index/files.mjs";

test("collects YAML files and accepts a navigation index", () => {
  expect(
    inspectSpecificationIndexFiles("specs", [
      { path: "specs/rules.yaml" },
      { path: "specs/README.md" },
    ]),
  ).toEqual({ yaml: [{ path: "specs/rules.yaml" }], errors: [] });
});

test("reports missing YAML files and disallowed files", () => {
  expect(
    inspectSpecificationIndexFiles("specs", [
      { path: "specs/README.md" },
      { path: "specs/data.json" },
    ]),
  ).toEqual({
    yaml: [],
    errors: [
      "specs must contain at least one YAML specification.",
      "specs/data.json is not an allowed specs file.",
    ],
  });
});

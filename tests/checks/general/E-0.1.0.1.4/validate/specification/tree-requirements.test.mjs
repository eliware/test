import { expect, test } from "@jest/globals";
import { validateSpecificationTreeRequirements } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/tree-requirements.mjs";

test("requires the root directives file and reports unsupported entries", () => {
  expect(
    validateSpecificationTreeRequirements([
      { path: "specs/README.md", type: "file" },
      { path: "specs/link", type: "unsupported" },
    ]),
  ).toEqual([
    "specs/link is an unsupported filesystem entry under specs/.",
    "specs/directives.yaml is required.",
  ]);
});

test("accepts a tree with the root directives file and supported entries", () => {
  expect(
    validateSpecificationTreeRequirements([
      { path: "specs/directives.yaml", type: "file" },
      { path: "specs/nested", type: "directory" },
    ]),
  ).toEqual([]);
});

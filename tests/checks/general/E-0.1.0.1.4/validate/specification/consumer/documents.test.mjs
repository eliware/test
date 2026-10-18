import { expect, test } from "@jest/globals";
import { validateConsumerSpecificationDocuments } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/consumer/documents.mjs";

const path = "specs/directives.yaml document 1";
const document = {
  version: "13.0",
  description: "Rules",
  directives: [{ id: "E-0.0", dos: ["Do"], donts: ["Do not"] }],
};
const rootState = {
  directivePathExists: true,
  directivePathParsed: true,
  directivePathHasDirectives: true,
};

test("accepts valid directive documents in the assigned namespace", () => {
  expect(
    validateConsumerSpecificationDocuments([{ path, value: document }], "E-0", rootState),
  ).toEqual([]);
});

test("requires the root file and a directive document", () => {
  expect(
    validateConsumerSpecificationDocuments([], "E-0", {
      directivePathExists: false,
      directivePathParsed: false,
      directivePathHasDirectives: false,
    }),
  ).toContain("specs/directives.yaml is required.");
  expect(
    validateConsumerSpecificationDocuments([], "E-0", {
      directivePathExists: true,
      directivePathParsed: true,
      directivePathHasDirectives: false,
    }),
  ).toContain("specs/directives.yaml must contain a directive document.");
});

test("validates all document IDs and structure", () => {
  const errors = validateConsumerSpecificationDocuments(
    [
      { path, value: document },
      { path: "specs/directives.yaml document 2", value: document },
      { path: "specs/extra.yaml document 1", value: { ...document, directives: null } },
    ],
    "E-0",
    rootState,
  );
  expect(errors).toContain("Duplicate specification rule ID: E-0.0.");
  expect(errors).toContain("specs/extra.yaml document 1.directives must be a nonempty array.");
});

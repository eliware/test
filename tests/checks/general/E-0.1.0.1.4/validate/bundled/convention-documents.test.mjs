import { expect, test } from "@jest/globals";
import { validateBundledConventionDocuments } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled/convention-documents.mjs";

const document = {
  version: "13.0",
  description: "General convention.",
  directives: [{ id: "E-0.0", dos: ["Keep rules clear."], donts: ["Do not mix rules."] }],
};
const path = "specs/conventions/general-deterministic.yaml document 1";

test("validates convention documents and their rule IDs", () => {
  expect(validateBundledConventionDocuments([{ path, value: document }], "E-0")).toEqual([]);
});

test("checks all documents and reports invalid content and duplicate IDs", () => {
  const errors = validateBundledConventionDocuments(
    [
      { path, value: document },
      { path: path.replace("document 1", "document 2"), value: document },
      { path: "specs/conventions/other.yaml document 1", value: { ...document, directives: null } },
    ],
    "E-0",
  );
  expect(errors).toContain("Duplicate specification rule ID: E-0.0.");
  expect(errors).toContain(
    "specs/conventions/other.yaml document 1.directives must be a nonempty array.",
  );
});

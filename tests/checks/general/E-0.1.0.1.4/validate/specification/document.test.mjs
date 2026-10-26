import { expect, test } from "@jest/globals";
import { validateSpecificationDocument } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/document.mjs";
import { conventionVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";

const valid = {
  version: conventionVersion,
  description: "Rules",
  directives: [{ id: "E-0.1", dos: ["Do"], donts: ["Do not"] }],
};

test("accepts valid documents and reports schema violations", () => {
  expect(validateSpecificationDocument(valid, "rules.yaml")).toEqual([]);
  expect(validateSpecificationDocument(null, "rules.yaml").join(" ")).toContain("document object");
  expect(
    validateSpecificationDocument({ ...valid, other: true }, "rules.yaml").join(" "),
  ).toContain("unsupported document");
  expect(
    validateSpecificationDocument({ ...valid, version: "", directives: [] }, "rules.yaml").join(
      " ",
    ),
  ).toContain("nonempty");
});

test("uses ordering-document rules only for ordering paths when enabled", () => {
  const orderingPath = "specs/conventions/ordering/custom.yaml";
  expect(validateSpecificationDocument(null, orderingPath).join(" ")).toContain(
    "must contain an ordering object",
  );
  expect(validateSpecificationDocument(valid, orderingPath, { ordering: false })).toEqual([]);
});

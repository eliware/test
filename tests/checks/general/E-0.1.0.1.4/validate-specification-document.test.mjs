import { expect, test } from "@jest/globals";
import { validateSpecificationDocument } from "../../../../src/checks/general/E-0.1.0.1.4/validate-specification-document.mjs";

const valid = {
  version: "12.0",
  description: "Rules",
  directives: [{ id: "E-0.1", dos: ["Do"], donts: ["Do not"] }],
};

test("accepts valid documents and reports schema violations", () => {
  expect(validateSpecificationDocument(valid, "rules.yaml")).toEqual([]);
  expect(validateSpecificationDocument(null, "rules.yaml").join(" ")).toContain("document object");
  expect(
    validateSpecificationDocument({ ...valid, other: true, requires: [1] }, "rules.yaml").join(" "),
  ).toContain("unsupported document");
  expect(
    validateSpecificationDocument({ ...valid, version: "", directives: [] }, "rules.yaml").join(
      " ",
    ),
  ).toContain("nonempty");
  expect(
    validateSpecificationDocument(
      { ...valid, directives: [null, { id: "A-1", dos: [], donts: [" "] }] },
      "rules.yaml",
    ).join(" "),
  ).toContain("valid E-rule ID");
  expect(
    validateSpecificationDocument(
      { ...valid, directives: [{ ...valid.directives[0], children: [] }] },
      "rules.yaml",
    ).join(" "),
  ).toContain("children must be a nonempty array");
  expect(
    validateSpecificationDocument(
      { ...valid, directives: [{ ...valid.directives[0], examples: [" "], extra: true }] },
      "rules.yaml",
    ).join(" "),
  ).toContain("unsupported fields");
});

test("accepts structured ordering documents and rejects malformed order values", () => {
  const ordering = {
    version: "12.0",
    description: "Canonical order",
    orders: { sections: ["first", "second"] },
  };
  expect(
    validateSpecificationDocument(ordering, "specs/conventions/ordering/sections.yaml"),
  ).toEqual([]);
  expect(
    validateSpecificationDocument(
      { ...ordering, orders: { sections: ["first", 4] } },
      "specs/conventions/ordering/sections.yaml",
    ).join(" "),
  ).toContain("orders must contain ordered values");
  expect(
    validateSpecificationDocument(null, "specs/conventions/ordering/sections.yaml").join(" "),
  ).toContain("ordering object");
  expect(
    validateSpecificationDocument(
      { ...ordering, other: true },
      "specs/conventions/ordering/x.yaml",
    ).join(" "),
  ).toContain("unsupported ordering fields");
  expect(
    validateSpecificationDocument(
      { ...ordering, version: "" },
      "specs/conventions/ordering/x.yaml",
    ).join(" "),
  ).toContain("version must be a nonempty string");
  expect(
    validateSpecificationDocument(
      { ...ordering, description: "" },
      "specs/conventions/ordering/x.yaml",
    ).join(" "),
  ).toContain("description must be a nonempty string");
});

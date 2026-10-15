import { expect, test } from "@jest/globals";
import { validateOrderingSpecificationDocument } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/ordering-specification-document.mjs";

const path = "specs/conventions/ordering/sections.yaml";
const valid = {
  version: "12.0",
  description: "Canonical order",
  orders: { sections: ["first", "second"] },
};

test("accepts valid ordering documents", () => {
  expect(validateOrderingSpecificationDocument(valid, path)).toEqual([]);
});

test("rejects invalid ordering document values", () => {
  expect(validateOrderingSpecificationDocument(null, path).join(" ")).toContain("ordering object");
  expect(
    validateOrderingSpecificationDocument({ ...valid, other: true }, path).join(" "),
  ).toContain("unsupported ordering fields");
  expect(
    validateOrderingSpecificationDocument({ ...valid, version: "" }, path).join(" "),
  ).toContain("version must be a nonempty string");
  expect(
    validateOrderingSpecificationDocument({ ...valid, description: "" }, path).join(" "),
  ).toContain("description must be a nonempty string");
  expect(
    validateOrderingSpecificationDocument(
      { ...valid, orders: { sections: ["first", 4] } },
      path,
    ).join(" "),
  ).toContain("orders must contain ordered values");
});

test("rejects invalid canonical order data", () => {
  expect(
    validateOrderingSpecificationDocument({ ...valid, orders: {} }, "readme-sections.yaml"),
  ).not.toEqual([]);
});

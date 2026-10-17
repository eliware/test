import { expect, test } from "@jest/globals";
import { validateSpecificationIndexContent } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/index/content.mjs";

const path = "specs/README.md";
const expected = ["directives.yaml", "nested/README.md"];

test("accepts navigation links in the expected order", () => {
  expect(
    validateSpecificationIndexContent(
      "# Specs\n\n- [Directives](directives.yaml)\n- [Nested](nested/README.md)",
      path,
      expected,
    ),
  ).toEqual([]);
});

test("rejects descriptive content, missing targets, and unexpected targets", () => {
  const errors = validateSpecificationIndexContent(
    "# Specs\n\nDescription\n- [Directives](directives.yaml)\n- [Other](other.yaml)",
    path,
    expected,
  );
  expect(errors).toContain(`${path} must be a navigation-only index.`);
  expect(errors).toContain(`${path} must link nested/README.md.`);
  expect(errors).toContain(`${path} links to unexpected target other.yaml.`);
});

test("rejects duplicate links and links in the wrong order", () => {
  const errors = validateSpecificationIndexContent(
    "- [Nested](nested/README.md)\n- [Nested again](nested/README.md)",
    path,
    expected,
  );
  expect(errors).toContain(`${path} must not duplicate index links.`);

  const orderErrors = validateSpecificationIndexContent(
    "- [Nested](nested/README.md)\n- [Directives](directives.yaml)",
    path,
    expected,
  );
  expect(orderErrors).toContain(`${path} must list index links in the required order.`);
});

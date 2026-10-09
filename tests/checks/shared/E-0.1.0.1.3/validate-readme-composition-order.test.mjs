import { expect, test } from "@jest/globals";
import { resolveReadmeHeadings } from "../../../../src/checks/shared/E-0.1.0.1.3/resolve-readme-headings.mjs";
import { validateReadmeCompositionOrder } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-composition-order.mjs";

test("checks selected profile order without requiring sections", () => {
  const packageJson = { eliware: { apply: ["general", "documentation"] } };
  const expected = resolveReadmeHeadings(packageJson);
  expect(validateReadmeCompositionOrder("## Navigation\n## Scope", expected)).toContain(
    "canonical order",
  );
  expect(validateReadmeCompositionOrder("## Table of Contents", expected)).toBeNull();
});

test("rejects sections from unselected profiles", () => {
  const expected = resolveReadmeHeadings({ eliware: { apply: ["general"] } });
  expect(validateReadmeCompositionOrder("## Exit codes", expected)).toContain("canonical order");
});

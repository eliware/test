import { expect, test } from "@jest/globals";
import { validateReadmeHeader } from "../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/header.mjs";

const order = {
  header: ["brand", "title-and-badges", "description", "table-of-contents"],
  headerLines: { brand: 0, "title-and-badges": 2, description: 4, "table-of-contents": 6 },
  tableOfContentsHeading: "Table of Contents",
};
const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const lines = [brand, "", "## fixture", "", "Description", "", "## Table of Contents"];

test("accepts the canonical README header", () => {
  expect(
    validateReadmeHeader(lines, lines, { name: "fixture", description: "Description" }, order),
  ).toBeNull();
});

test("reports incorrect brand, title, and header order", () => {
  expect(validateReadmeHeader(["bad"], [], {}, order)).toContain("logo header");
  expect(validateReadmeHeader(lines, lines, {}, order)).toContain("title");
  expect(
    validateReadmeHeader(
      [...lines.slice(0, 4), "Wrong", "", "## Table of Contents"],
      [...lines.slice(0, 4), "Wrong", "", "## Table of Contents"],
      { name: "fixture", description: "Description" },
      order,
    ),
  ).toContain("description");
});

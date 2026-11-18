import { expect, test } from "@jest/globals";
import validateReadmeTocLinks from "../../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/toc-links/validate-readme-toc-links.mjs";

test("validates ordered inline and reference links in the table of contents", () => {
  expect(
    validateReadmeTocLinks(
      [
        "## Table of Contents",
        "[Features](#features)",
        "[Testing][guide]",
        "[guide]: #testing",
        "## Features",
      ],
      0,
      ["Features", "Testing"],
    ),
  ).toBeNull();
  expect(
    validateReadmeTocLinks(["## Table of Contents", "[Features](#other)"], 0, ["Features"]),
  ).toContain("must link each content heading once in order");
});

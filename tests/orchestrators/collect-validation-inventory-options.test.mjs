import { expect, test } from "@jest/globals";
import { collectValidationInventoryOptions } from "../../src/orchestrators/collect-validation-inventory-options.mjs";

test("combines unique inventory options from selected checks", () => {
  expect(
    collectValidationInventoryOptions([
      {
        ruleId: "a",
        repositoryInventoryOptions: {
          expandedDirectories: ["docs"],
          includeTestResultsUnder: ["docs"],
        },
      },
      {
        ruleId: "b",
        repositoryInventoryOptions: {
          expandedDirectories: ["docs", ".github"],
          includeTestResults: true,
        },
      },
    ]),
  ).toEqual({
    expandedDirectories: ["docs", ".github"],
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
  });
});

test("limits options to one mode rule when supplied", () => {
  expect(
    collectValidationInventoryOptions(
      [
        {
          ruleId: "docs",
          repositoryInventoryOptions: { expandedDirectories: ["docs"], includeTestResults: true },
        },
        { ruleId: "audit", repositoryInventoryOptions: { expandedDirectories: [".github"] } },
      ],
      "audit",
    ),
  ).toEqual({
    expandedDirectories: [".github"],
    includeTestResults: false,
    includeTestResultsUnder: [],
  });
});

test("defaults checks without inventory options to an empty inventory policy", () => {
  expect(collectValidationInventoryOptions([{ ruleId: "no-options" }])).toEqual({
    expandedDirectories: [],
    includeTestResults: false,
    includeTestResultsUnder: [],
  });
});

test("expands documentation and example trees for application indexes", () => {
  expect(
    collectValidationInventoryOptions([
      {
        ruleId: "application-docs",
        repositoryInventoryOptions: { expandedDirectories: ["docs", "examples"] },
      },
    ]),
  ).toMatchObject({ expandedDirectories: ["docs", "examples"] });
});

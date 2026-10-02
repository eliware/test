import { expect, test } from "@jest/globals";
import { validateExampleProfileHeadings } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-example-profile-headings.mjs";

test("accepts an object mapping supported profiles to heading arrays", () => {
  const errors = [];
  validateExampleProfileHeadings(
    { application: ["Configuration"], private: [] },
    "profileHeadings",
    errors,
  );
  expect(errors).toEqual([]);
});

test("reports malformed profile maps and heading entries", () => {
  const errors = [];
  validateExampleProfileHeadings(null, "profileHeadings", errors);
  validateExampleProfileHeadings(
    { unknown: [], application: "Configuration", cli: [" ", 4] },
    "profileHeadings",
    errors,
  );
  expect(errors).toEqual(
    expect.arrayContaining([
      "profileHeadings must be an object.",
      "profileHeadings contains unsupported profile unknown.",
      "profileHeadings.application must be an array.",
      "profileHeadings.cli[0] must be a non-empty string.",
      "profileHeadings.cli[1] must be a non-empty string.",
    ]),
  );
});

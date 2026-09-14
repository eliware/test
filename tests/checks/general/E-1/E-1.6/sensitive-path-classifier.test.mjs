import { expect, test } from "@jest/globals";
import { isForbiddenPath } from "../../../../../src/checks/general/E-1/E-1.6/sensitive-path-classifier.mjs";

test("classifies sensitive paths while permitting the environment template", () => {
  expect(isForbiddenPath("credentials.json")).toBe(true);
  expect(isForbiddenPath("src/reference-registration-key.mjs")).toBe(false);
  expect(isForbiddenPath(".env.example")).toBe(false);
  expect(isForbiddenPath("docs/readme.md")).toBe(false);
});

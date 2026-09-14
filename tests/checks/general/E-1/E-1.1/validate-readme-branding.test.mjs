import { expect, test } from "@jest/globals";
import { validateReadmeBranding } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-branding.mjs";

const complete = "eliware.org/logos/brand.png github.com actions/workflows/ci/badge.svg [license]";

test("accepts complete branding", () => {
  expect(validateReadmeBranding(complete)).toBeNull();
});

test("reports missing branding, CI, or license", () => {
  expect(validateReadmeBranding(complete.replace("eliware.org/logos/brand.png", "brand"))).toContain("branding");
  expect(validateReadmeBranding(complete.replace("actions/workflows/ci/badge.svg", "ci"))).toContain("CI badge");
  expect(validateReadmeBranding(complete.replace("[license]", "license text"))).toContain("license");
});

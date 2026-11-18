import { expect, test } from "@jest/globals";
import isSpecificationsIndexTarget from "../../../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/specifications/link/is-specifications-index-target.mjs";

test("recognizes normalized specifications index links", () => {
  for (const target of [
    "specs/README.md",
    "./specs/README.md?view=full",
    "<specs\\README.md#overview>",
  ]) {
    expect(isSpecificationsIndexTarget(target)).toBe(true);
  }
  for (const target of ["README.md", "specs/index.md", "../specs/README.md"]) {
    expect(isSpecificationsIndexTarget(target)).toBe(false);
  }
});

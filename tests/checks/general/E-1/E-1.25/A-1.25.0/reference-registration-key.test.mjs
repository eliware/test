import { expect, test } from "@jest/globals";
import { referenceRegistrationKey } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/reference-registration-key.mjs";

test("normalizes repository-relative registration keys", () => {
  expect(referenceRegistrationKey("../../docs/authority-map.json")).toBe("docs/authority-map.json");
  expect(referenceRegistrationKey("./docs/README.md")).toBe("docs/README.md");
  expect(referenceRegistrationKey("package.json")).toBe("package.json");
});

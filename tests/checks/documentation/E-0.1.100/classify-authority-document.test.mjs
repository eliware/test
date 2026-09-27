import { expect, test } from "@jest/globals";
import { classifyAuthorityDocument } from "../../../../src/checks/documentation/E-0.1.100/classify-authority-document.mjs";

test("classifies authority maps and records by their repository-relative paths", () => {
  expect(classifyAuthorityDocument("authority-map.json", {})).toBe("map");
  expect(classifyAuthorityDocument("nested\\specs\\authority.json", {})).toBe("record");
  expect(classifyAuthorityDocument("specs/other.json", {})).toBeNull();
});

test("does not classify the authority-map schema as an authority registry", () => {
  expect(
    classifyAuthorityDocument("specs/authority-map.json", {
      requiredPath: "specs/authority.json",
      requiredFields: { repositoryId: "required" },
    }),
  ).toBeNull();
});

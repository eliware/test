import { expect, test } from "@jest/globals";
import { validatePublicationMetadata } from "../../../../src/checks/npm-published/E-1.140/validate-publication-metadata.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
  scripts: { pack: "eliware-test --pack" },
};

test("accepts the public package publication contract", () => {
  expect(validatePublicationMetadata(validPackage)).toBeNull();
});

test.each([
  { engines: { node: ">=25" } },
  { publishConfig: {} },
  { files: ["README.md"] },
  { scripts: {} },
])("rejects incomplete package publication metadata %#", (override) => {
  expect(validatePublicationMetadata({ ...validPackage, ...override })).toBeTruthy();
});

import { expect, test } from "@jest/globals";
import { validatePublicationFiles } from "../../../../src/checks/general/E-1/validate-publication-files.mjs";

test("validates public package file allowlists", () => {
  const packageJson = { eliware: { apply: ["npm-published"] }, files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"] };
  expect(validatePublicationFiles(packageJson)).toBeNull();
  expect(validatePublicationFiles({ eliware: { apply: ["npm-published"] } })).toContain("allowlist");
  expect(validatePublicationFiles({ private: true })).toBeNull();
});

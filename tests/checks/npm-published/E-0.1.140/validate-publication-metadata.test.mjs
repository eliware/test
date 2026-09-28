import { expect, test } from "@jest/globals";
import { validatePublicationMetadata } from "../../../../src/checks/npm-published/E-0.1.140/validate-publication-metadata.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
  scripts: { pack: "eliware-test --pack" },
};

test("accepts the public package publication contract", () => {
  expect(validatePublicationMetadata(validPackage)).toBeNull();
});

test("allows the self-hosted pack script only when requested", () => {
  const selfHostedPackage = {
    ...validPackage,
    scripts: { pack: "node bin/eliware-test.mjs --pack" },
  };
  expect(validatePublicationMetadata(selfHostedPackage, { selfHosted: true })).toBeNull();
  expect(validatePublicationMetadata(selfHostedPackage)).toContain(
    "Public npm packages must define pack=eliware-test --pack.",
  );
});

test.each([
  { engines: { node: ">=25" } },
  { publishConfig: {} },
  { files: ["README.md"] },
  { files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "specs/"] },
  { files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/"] },
  { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
  { scripts: {} },
])("rejects incomplete package publication metadata %#", (override) => {
  expect(validatePublicationMetadata({ ...validPackage, ...override })).toBeTruthy();
});

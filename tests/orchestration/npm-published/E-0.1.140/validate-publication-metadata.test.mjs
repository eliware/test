import { expect, test } from "@jest/globals";
import { validatePublicationMetadata } from "../../../../src/orchestration/npm-published/E-0.1.140/validate-publication-metadata.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "bin/"],
  scripts: { pack: "eliware-test --pack" },
  eliware: { apply: ["application", "npm-published"] },
};

test("accepts the public package publication contract", () => {
  expect(validatePublicationMetadata(validPackage)).toBeNull();
  expect(
    validatePublicationMetadata({
      ...validPackage,
      files: ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"],
      eliware: undefined,
    }),
  ).toBeNull();
});

test("allows the self-hosted pack script only when requested", () => {
  const selfHostedPackage = {
    ...validPackage,
    name: "@eliware/test",
    files: [...validPackage.files, "specs/"],
    eliware: { apply: ["application", "cli", "npm-published"] },
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
  { files: ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "specs/"] },
  { files: ["src/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "docs/"] },
  { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
  { scripts: {} },
  { scripts: { prepare: "node build.mjs" } },
])("rejects incomplete package publication metadata %#", (override) => {
  expect(validatePublicationMetadata({ ...validPackage, ...override })).toBeTruthy();
});

test("requires exact profile-derived allowlists", () => {
  const cliPackage = {
    ...validPackage,
    eliware: { apply: ["application", "cli", "npm-published"] },
  };
  expect(validatePublicationMetadata(cliPackage)).toBeNull();
  expect(
    validatePublicationMetadata({ ...cliPackage, files: [...cliPackage.files, "tests/"] }),
  ).toContain("profile-derived");
  expect(
    validatePublicationMetadata({ ...cliPackage, files: [...cliPackage.files, "bin/"] }),
  ).toContain("profile-derived");
  expect(
    validatePublicationMetadata({ ...cliPackage, files: ["../outside", ...cliPackage.files] }),
  ).toContain("profile-derived");
});

test("limits environment examples to runtime environment profiles", () => {
  expect(
    validatePublicationMetadata({
      ...validPackage,
      files: [...validPackage.files, ".env.example"],
    }),
  ).toBeNull();
  const packageWithEnvironmentTemplate = {
    ...validPackage,
    files: [
      "src/",
      "docs/",
      "README.md",
      "AGENTS.md",
      "LICENSE",
      "RELEASE_NOTES.md",
      ".env.example",
    ],
    eliware: { apply: ["general", "npm-published"] },
  };
  expect(validatePublicationMetadata(packageWithEnvironmentTemplate)).toContain(
    "profile that supports runtime environment configuration",
  );
});

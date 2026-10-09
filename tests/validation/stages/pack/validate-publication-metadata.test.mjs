import { expect, test } from "@jest/globals";
import { validatePublicationMetadata } from "../../../../src/validation/stages/pack/validate-publication-metadata.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: [
    "src/",
    "docs/",
    "README.md",
    "AGENTS.md",
    "LICENSE",
    "RELEASE_NOTES.md",
    "bin/",
    "specs/",
  ],
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
  { files: undefined },
  { files: ["README.md"] },
  { files: ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "bin/"] },
  { files: ["src/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "docs/"] },
  { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
  { scripts: {} },
  { scripts: { prepare: "node build.mjs" } },
])("rejects incomplete package publication metadata %#", (override) => {
  expect(validatePublicationMetadata({ ...validPackage, ...override })).toBeTruthy();
});

test("allows runtime entries after the required profile entries", () => {
  const cliPackage = {
    ...validPackage,
    eliware: { apply: ["application", "cli", "npm-published"] },
  };
  expect(validatePublicationMetadata(cliPackage)).toBeNull();
  expect(
    validatePublicationMetadata({
      ...cliPackage,
      files: [...cliPackage.files, "assets/", "data.json"],
    }),
  ).toBeNull();
  expect(
    validatePublicationMetadata({
      ...cliPackage,
      files: cliPackage.files.filter((entry) => entry !== "specs/"),
    }),
  ).toContain("must start with required entries in this order");
});

test("rejects duplicate and misordered required entries", () => {
  const cliPackage = {
    ...validPackage,
    eliware: { apply: ["application", "cli", "npm-published"] },
  };
  expect(
    validatePublicationMetadata({ ...cliPackage, files: [...cliPackage.files, "bin/"] }),
  ).toContain("duplicate paths");
  expect(
    validatePublicationMetadata({
      ...cliPackage,
      files: ["bin/", ...cliPackage.files.filter((entry) => entry !== "bin/")],
    }),
  ).toContain("must start with required entries in this order");
  expect(
    validatePublicationMetadata({ ...cliPackage, files: ["../outside", ...cliPackage.files] }),
  ).toContain("must start with required entries in this order");
  expect(
    validatePublicationMetadata({
      ...cliPackage,
      files: [...cliPackage.files, { path: "runtime.mjs" }],
    }),
  ).toContain("only string paths");
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
      "specs/",
      ".env.example",
    ],
    eliware: { apply: ["general", "npm-published"] },
  };
  expect(validatePublicationMetadata(packageWithEnvironmentTemplate)).toContain(
    "profile that supports runtime environment configuration",
  );
  expect(
    validatePublicationMetadata({
      ...validPackage,
      files: [...validPackage.files, ".env.example", "assets/"],
    }),
  ).toContain(".env.example must be the final");
});

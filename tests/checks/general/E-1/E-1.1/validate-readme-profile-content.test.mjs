import { expect, test } from "@jest/globals";
import { validateReadmeProfileContent } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-profile-content.mjs";

test("enforces application configuration and operations content", () => {
  const complete =
    "## Configuration\nRuntime configuration defaults to none.\n## Operations\nStartup, shutdown, workflow, and boundaries.";
  expect(
    validateReadmeProfileContent(complete, { eliware: { apply: ["application"] } }),
  ).toBeNull();
  expect(
    validateReadmeProfileContent(complete.replace("defaults to none", "settings"), {
      eliware: { apply: ["application"] },
    }),
  ).toContain("Configuration requirement");
  expect(
    validateReadmeProfileContent(
      complete.replace("Startup, shutdown, workflow, and boundaries", "workflow"),
      {
        eliware: { apply: ["application"] },
      },
    ),
  ).toContain("Operations requirement");
});

test("enforces CLI setup, command safety, and exit-code content", () => {
  const complete =
    "## Setup\nInstall from npm.\n## Commands\nCommand examples include --help, --version, Windows platforms, read-only behavior.\n## Exit codes\nExit code 0 means success; other codes indicate failure.";
  expect(validateReadmeProfileContent(complete, { eliware: { apply: ["cli"] } })).toBeNull();
  expect(
    validateReadmeProfileContent(complete.replace("Install from npm", "Use the tool"), {
      eliware: { apply: ["cli"] },
    }),
  ).toContain("Commands requirement 1");
  expect(
    validateReadmeProfileContent(complete.replace("--help", "help"), {
      eliware: { apply: ["cli"] },
    }),
  ).toContain("Commands requirement");
  expect(
    validateReadmeProfileContent(complete.replace("Exit code 0 means success", "Codes are zero"), {
      eliware: { apply: ["cli"] },
    }),
  ).toContain("Exit codes requirement");
});

test("enforces npm-published setup and usage content", () => {
  const complete =
    "## Setup\nUse npm install @eliware/fixture.\n## Usage\nThe entrypoint version is documented for release.";
  expect(
    validateReadmeProfileContent(complete, { eliware: { apply: ["npm-published"] } }),
  ).toBeNull();
  expect(
    validateReadmeProfileContent(complete.replace("npm install", "install"), {
      eliware: { apply: ["npm-published"] },
    }),
  ).toContain("Setup requirement");
  expect(
    validateReadmeProfileContent(complete.replace("entrypoint version", "command"), {
      eliware: { apply: ["npm-published"] },
    }),
  ).toContain("Usage requirement");
  const cliPublished = `${complete}\n## Commands\nThe command entrypoint is bin/fixture.mjs, versioned for release; examples use --help, --version, Windows, and read-only mode.\n## Exit codes\nExit code 0 is success and other codes are failures.`;
  expect(
    validateReadmeProfileContent(cliPublished, {
      eliware: { apply: ["npm-published", "cli"] },
    }),
  ).toBeNull();
});

test("does not impose profile content when profiles do not apply", () => {
  expect(validateReadmeProfileContent("")).toBeNull();
});

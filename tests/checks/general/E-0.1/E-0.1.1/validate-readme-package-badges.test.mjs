import { expect, test } from "@jest/globals";
import { validateReadmePackageBadges } from "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-package-badges.mjs";

const heading =
  "## @eliware/fixture [![npm](https://img.shields.io/npm/v/@eliware/fixture)](https://www.npmjs.com/package/@eliware/fixture) [![License](https://img.shields.io/github/license/eliware/fixture)](https://github.com/eliware/fixture/blob/main/LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/ci.yml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/ci.yml)";
const metadata = {
  name: "@eliware/fixture",
  repository: "git+https://github.com/eliware/fixture.git",
  eliware: { apply: ["npm-published"] },
};

test("accepts the exact package title and canonical applicable badges", () => {
  expect(validateReadmePackageBadges(heading, metadata)).toBeNull();
  const nonPublishedHeading = heading.replace(
    /^## @eliware\/fixture \[!\[npm\][^ ]+ /u,
    "## @eliware/fixture ",
  );
  expect(
    validateReadmePackageBadges(nonPublishedHeading, {
      ...metadata,
      eliware: { apply: ["private"] },
    }),
  ).toBeNull();
});

test("requires package identity and a first level-two title", () => {
  expect(validateReadmePackageBadges(heading)).toContain("package.json.name");
  expect(validateReadmePackageBadges(heading, {})).toContain("package.json.name");
  expect(validateReadmePackageBadges(heading, { name: 42 })).toContain("package.json.name");
  expect(validateReadmePackageBadges(heading, { name: "" })).toContain("package.json.name");
  expect(validateReadmePackageBadges("README without a title", metadata)).toContain(
    "standard package heading",
  );
});

test("rejects a package title that appears after the Table of Contents", () => {
  expect(validateReadmePackageBadges(`## Table of Contents\n\n${heading}`, metadata)).toContain(
    "must precede the Table of Contents",
  );
});

test("requires the package title to be the first level-two heading", () => {
  expect(validateReadmePackageBadges(`## Features\n\n${heading}`, metadata)).toContain(
    "must be the first level-two heading",
  );
});

test("rejects noncanonical title and badge text, order, images, or targets", () => {
  for (const changed of [
    heading.replace("## @eliware/fixture", "## @eliware/fixture extra"),
    heading.replace("img.shields.io/github/license/eliware/fixture", "img.shields.io/wrong"),
    heading.replace("blob/main/LICENSE", "LICENSE"),
    heading.replace("actions/workflows/ci.yml/badge.svg", "workflows/other.yml/badge.svg"),
    heading.replace("npm/v/@eliware/fixture", "npm/v/other"),
    heading.replace("[![License]", "[![license]"),
  ]) {
    expect(validateReadmePackageBadges(changed, metadata)).toContain("exactly match");
  }
});

test("rejects invalid repository metadata for canonical badge targets", () => {
  expect(
    validateReadmePackageBadges(heading, { ...metadata, repository: "ssh://invalid/repo" }),
  ).toContain("valid GitHub repository URL");
  expect(
    validateReadmePackageBadges(heading, {
      ...metadata,
      repository: { url: "https://github.com/eliware/fixture" },
    }),
  ).toBeNull();
});

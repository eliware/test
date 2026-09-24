import { expect, test } from "@jest/globals";
import { validateReadmePackageBadges } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-package-badges.mjs";

const heading =
  "## @eliware/fixture [![npm version](https://img.shields.io/npm/v/@eliware/fixture.svg)](https://www.npmjs.com/package/@eliware/fixture) [![license](https://img.shields.io/github/license/eliware/fixture.svg)](LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/ci.yml/badge.svg)](https://github.com/eliware/fixture)";
const metadata = { name: "@eliware/fixture", eliware: { apply: ["npm-published"] } };

test("accepts required package identity and badges", () => {
  expect(validateReadmePackageBadges(heading, metadata)).toBeNull();
  expect(validateReadmePackageBadges(heading.replace(/ \[!\[npm version\][^\n]+?\)(?= \[!\[license\])/u, ""))).toBeNull();
});

test("requires the package heading and public npm badge to match package metadata", () => {
  expect(validateReadmePackageBadges("## Fixture", metadata)).toContain("package heading");
  expect(
    validateReadmePackageBadges(
      heading.replace("/package/@eliware/fixture", "/package/wrong"),
      metadata,
    ),
  ).toContain("npm version badge");
});

test("rejects npm badges unless the npm-published profile is applied", () => {
  expect(
    validateReadmePackageBadges(heading, { name: "@eliware/fixture", private: true, eliware: { apply: ["private"] } }),
  ).toContain("do not apply the npm-published profile");
  expect(
    validateReadmePackageBadges(heading, {
      name: "@eliware/fixture",
      publishConfig: { access: "restricted" },
    }),
  ).toContain("do not apply the npm-published profile");
  expect(validateReadmePackageBadges(heading, { name: "@eliware/fixture", publishConfig: { access: "public" } })).toContain("do not apply the npm-published profile");
});

test("requires the license and CI badges", () => {
  expect(
    validateReadmePackageBadges(heading.replace(/ \[!\[license\][^\n]+/u, ""), metadata),
  ).toContain("license badge");
  expect(validateReadmePackageBadges(heading.replace(/ \[!\[CI\][^\n]+/u, ""), metadata)).toContain(
    "GitHub CI badge",
  );
});

import { expect, test } from "@jest/globals";
import { validateNpmReadmeBadge } from "../../../../src/checks/npm-published/E-0.1.10.1.0/validate-npm-readme-badge.mjs";

const packageJson = {
  name: "@eliware/example",
  repository: { url: "git+https://github.com/eliware/example.git" },
};
const line =
  "@eliware/example [![npm](https://img.shields.io/npm/v/@eliware/example)](https://www.npmjs.com/package/@eliware/example) [![License](https://img.shields.io/github/license/eliware/example)](https://github.com/eliware/example/blob/main/LICENSE) [![CI](https://github.com/eliware/example/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/example/actions/workflows/ci.yaml)";

test("requires the canonical npm publication badge order", () => {
  expect(validateNpmReadmeBadge(`header\n\n${line}`, packageJson)).toBeNull();
  expect(validateNpmReadmeBadge("header\n\nwrong", packageJson)).toContain("npm, License, and CI");
});

test("requires package and GitHub repository metadata", () => {
  expect(validateNpmReadmeBadge("header", {})).toContain("GitHub repository");
  expect(validateNpmReadmeBadge("header")).toContain("GitHub repository");
  expect(
    validateNpmReadmeBadge(`header\n\n${line}`, {
      ...packageJson,
      repository: "https://github.com/eliware/example.git",
    }),
  ).toBeNull();
});

import { expect, test } from "@jest/globals";
import { validateReadmeBranding } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-branding.mjs";

const pkg = {
  name: "@eliware/fixture",
  repository: "git+https://github.com/eliware/fixture.git",
  eliware: { apply: ["npm-published"] },
};
const line =
  "@eliware/fixture [![npm](https://img.shields.io/npm/v/@eliware/fixture)](https://www.npmjs.com/package/@eliware/fixture) [![License](https://img.shields.io/github/license/eliware/fixture)](https://github.com/eliware/fixture/blob/main/LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/ci.yaml)";
const header =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const readme = `${header}\n\n${line}`;

test("accepts canonical package badges", () => {
  expect(validateReadmeBranding(readme, pkg)).toBeNull();
});

test("rejects incomplete package metadata and badge rows", () => {
  expect(validateReadmeBranding(readme, {})).toContain("package name");
  expect(validateReadmeBranding("wrong", pkg)).toContain("canonical logo header");
  expect(validateReadmeBranding(`${header}\n\nintro\n\n${line}`, pkg)).toContain(
    "canonical logo header",
  );
});

test("supports object repository metadata and rejects npm branding without publication", () => {
  const plain = {
    name: "@eliware/fixture",
    repository: { url: "https://github.com/eliware/fixture" },
  };
  const plainRow = line.replace(
    " [![npm](https://img.shields.io/npm/v/@eliware/fixture)](https://www.npmjs.com/package/@eliware/fixture)",
    "",
  );
  expect(validateReadmeBranding(`${header}\n\n${plainRow}`, plain)).toBeNull();
  expect(validateReadmeBranding(readme, plain)).toContain("without npm-published");
  expect(validateReadmeBranding("", undefined)).toContain("package name");
});

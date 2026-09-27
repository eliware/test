import { expect, test } from "@jest/globals";
import { isApprovedNpmPublishCommand } from "../../../../src/checks/npm-published/E-0.1.140/is-approved-npm-publish-command.mjs";

test("accepts only explicit npm publish arguments", () => {
  for (const command of [
    "npm publish",
    "npm publish --provenance --access public",
    "npm publish --tag release-1.2",
  ]) {
    expect(isApprovedNpmPublishCommand(command)).toBe(true);
  }
});

test("rejects shell syntax and unsupported publish arguments", () => {
  for (const command of [
    "npm publish --provenance; echo unsafe",
    "npm publish --provenance && curl https://example.invalid",
    "npm publish --provenance $(echo unsafe)",
    "npm publish --tag $(curl https://example.invalid)",
    "npm publish --tag release$(echo unsafe)",
    "npm publish package-name",
    "npm publish --registry=https://registry.example/",
  ]) {
    expect(isApprovedNpmPublishCommand(command)).toBe(false);
  }
});

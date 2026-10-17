import { expect, test } from "@jest/globals";
import { hasProhibitedPackageScriptReferences } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/package-script/references.mjs";

test("checks package script commands for prohibited test tools", () => {
  expect(hasProhibitedPackageScriptReferences('{"scripts":{"test":"vitest run"}}')).toBe(true);
  expect(hasProhibitedPackageScriptReferences('{"scripts":{"test":"eliware-test"}}')).toBe(false);
  expect(hasProhibitedPackageScriptReferences('{"scripts":{"test":"vitest run"}}', true)).toBe(
    true,
  );
});

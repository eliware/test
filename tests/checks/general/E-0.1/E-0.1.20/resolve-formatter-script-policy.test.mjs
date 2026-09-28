import { expect, test } from "@jest/globals";
import { resolveFormatterScriptPolicy } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-formatter-script-policy.mjs";

test("derives package-profile and capability allowances", () => {
  expect(
    resolveFormatterScriptPolicy({
      name: "@eliware/test",
      eliware: {
        apply: ["npm-published", "web"],
        capabilities: ["typecheck", "build"],
      },
    }),
  ).toEqual({
    requiresPack: true,
    selfHosted: true,
    allowedAdditionalScripts: ["typecheck", "build", "lighthouse", "puppeteer"],
  });
});

test("uses no profile exceptions for missing or malformed metadata", () => {
  expect(resolveFormatterScriptPolicy()).toEqual({
    requiresPack: false,
    selfHosted: false,
    allowedAdditionalScripts: [],
  });
  expect(resolveFormatterScriptPolicy({ eliware: { apply: "web", capabilities: null } })).toEqual({
    requiresPack: false,
    selfHosted: false,
    allowedAdditionalScripts: [],
  });
});

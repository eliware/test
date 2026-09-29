import { expect, test } from "@jest/globals";
import { resolveFormatterScriptPolicy } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-formatter-script-policy.mjs";

test("derives additional scripts from applicable profiles", () => {
  expect(
    resolveFormatterScriptPolicy({
      name: "@eliware/test",
      eliware: {
        apply: ["npm-published", "web", "library"],
      },
    }),
  ).toEqual({
    requiresPack: true,
    selfHosted: true,
    allowedAdditionalScripts: ["typecheck", "build", "lighthouse", "puppeteer"],
  });
});

test("does not use generic capability metadata to allow profile scripts", () => {
  expect(
    resolveFormatterScriptPolicy({
      eliware: { apply: ["web"], capabilities: ["typecheck"] },
    }),
  ).toEqual({
    requiresPack: false,
    selfHosted: false,
    allowedAdditionalScripts: ["build", "lighthouse", "puppeteer"],
  });
});

test("uses no profile exceptions for missing or malformed metadata", () => {
  expect(resolveFormatterScriptPolicy()).toEqual({
    requiresPack: false,
    selfHosted: false,
    allowedAdditionalScripts: [],
  });
  expect(resolveFormatterScriptPolicy({ eliware: { apply: "web" } })).toEqual({
    requiresPack: false,
    selfHosted: false,
    allowedAdditionalScripts: [],
  });
});

import { expect, test } from "@jest/globals";
import { validateBrowserTooling } from "../../../../src/checks/web/E-0.1.6.1.2/validate-browser-tooling.mjs";

test("reports each missing browser dependency and script", () => {
  expect(validateBrowserTooling()).toEqual([
    "Web applications must directly declare lighthouse.",
    "Web applications must define a nonempty lighthouse script.",
    "Web applications must directly declare puppeteer.",
    "Web applications must define a nonempty puppeteer script.",
  ]);
  expect(
    validateBrowserTooling({ dependencies: { lighthouse: "1", puppeteer: "1" }, scripts: {} }),
  ).toEqual([
    "Web applications must define a nonempty lighthouse script.",
    "Web applications must define a nonempty puppeteer script.",
  ]);
});

test("accepts browser tools in direct development dependencies", () => {
  expect(
    validateBrowserTooling({
      devDependencies: { lighthouse: "^1.0.0", puppeteer: "^1.0.0" },
      scripts: { lighthouse: "lighthouse", puppeteer: "puppeteer" },
    }),
  ).toEqual([]);
});

test("rejects invalid direct dependency values", () => {
  expect(
    validateBrowserTooling({
      dependencies: { lighthouse: {} },
      scripts: { lighthouse: "lighthouse", puppeteer: "puppeteer" },
    }),
  ).toEqual([
    "Web applications must directly declare lighthouse.",
    "Web applications must directly declare puppeteer.",
  ]);
});

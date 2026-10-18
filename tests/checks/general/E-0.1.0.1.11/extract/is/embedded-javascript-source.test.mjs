import { expect, test } from "@jest/globals";
import { isEmbeddedJavaScriptSource } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/embedded-javascript-source.mjs";

test("recognizes multiline JavaScript source", () => {
  expect(
    isEmbeddedJavaScriptSource(
      'const CACHE = "mail-shell-v1";\nself.addEventListener("fetch", handler);',
    ),
  ).toBe(true);
});

test.each([undefined, "Use the service worker to load the page.", "not valid JavaScript\ntext"])(
  "keeps ordinary or invalid text in the prose path: %s",
  (value) => {
    expect(isEmbeddedJavaScriptSource(value)).toBe(false);
  },
);

import { expect, test } from "@jest/globals";
import { validateWebBuild } from "../../../../src/checks/web/E-0.1.6.1.2/validate-web-build.mjs";

const build =
  "webpack --entry ./src/client-entry.mjs --output-path ./dist --output-filename client.js --mode production";

test("requires a direct webpack dependency and the standard build command", () => {
  expect(validateWebBuild()).toEqual([
    "Web applications must directly declare webpack.",
    "Web applications must define the standard webpack build script.",
  ]);
  expect(
    validateWebBuild({
      devDependencies: { webpack: "^5.0.0" },
      scripts: { build },
    }),
  ).toEqual([]);
});

test("rejects a missing webpack dependency", () => {
  expect(validateWebBuild({ scripts: { build } })).toEqual([
    "Web applications must directly declare webpack.",
  ]);
});

test.each([
  "vite build",
  "webpack --entry ./src/client-entry.mjs --output-path ./build --output-filename client.js --mode production",
  `${build} && echo done`,
])("rejects a nonstandard build command: %s", (command) => {
  expect(
    validateWebBuild({ devDependencies: { webpack: "^5.0.0" }, scripts: { build: command } }),
  ).toEqual(["Web applications must use the standard webpack build command."]);
});

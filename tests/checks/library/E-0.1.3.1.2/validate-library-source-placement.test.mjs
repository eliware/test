import { expect, test } from "@jest/globals";
import { validateLibrarySourcePlacement } from "../../../../src/checks/library/E-0.1.3.1.2/validate-library-source-placement.mjs";

test("allows maintained library, test, and example modules", () => {
  expect(
    validateLibrarySourcePlacement([
      "src/index.mjs",
      "tests/index.test.mjs",
      "examples/basic.mjs",
      "test-fixtures/sample.mjs",
      "dist/bundle.mjs",
    ]),
  ).toEqual([]);
});

test("rejects implementation modules outside library roots", () => {
  expect(validateLibrarySourcePlacement(["bin/cli.mjs", "scripts/build.js", "notes.txt"])).toEqual([
    "bin/cli.mjs is outside the allowed library source and test directories.",
    "scripts/build.js is outside the allowed library source and test directories.",
  ]);
});

test("allows bin modules when the application profile applies", () => {
  expect(
    validateLibrarySourcePlacement(["bin/cli.mjs", "lib/worker.mjs"], {
      applicationApplies: true,
    }),
  ).toEqual(["lib/worker.mjs is outside the allowed library source and test directories."]);
});

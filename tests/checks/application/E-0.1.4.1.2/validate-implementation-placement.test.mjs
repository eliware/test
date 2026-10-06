import { expect, test } from "@jest/globals";
import { validateImplementationPlacement } from "../../../../src/checks/application/E-0.1.4.1.2/validate-implementation-placement.mjs";

test("rejects maintained implementation modules outside approved roots", () => {
  expect(
    validateImplementationPlacement(["lib/worker.mjs", "tools/helper.ts", "src/main.mjs"]),
  ).toEqual([
    "lib/worker.mjs is an implementation module outside its allowed root.",
    "tools/helper.ts is an implementation module outside its allowed root.",
  ]);
});

test("allows source, launchers, tests, fixtures, and examples", () => {
  expect(
    validateImplementationPlacement([
      "src/main.mjs",
      "bin/launch.mjs",
      "tests/main.test.mjs",
      "test-fixtures/example.mjs",
      "examples/demo.js",
    ]),
  ).toEqual([]);
});

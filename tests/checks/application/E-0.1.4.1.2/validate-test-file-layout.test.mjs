import { expect, test } from "@jest/globals";
import { validateTestFileLayout } from "../../../../src/checks/application/E-0.1.4.1.2/validate-test-file-layout.mjs";

test("reports generated test output outside artifacts", () => {
  expect(validateTestFileLayout(["tests/a.test.mjs", "tests/__snapshots__/a.snap"])).toEqual([
    "tests/__snapshots__/a.snap is generated test output; store output under ignored artifacts/.",
  ]);
});

test("allows files outside generated output directories", () => {
  expect(validateTestFileLayout(["tests/a.test.mjs", "test-fixtures/data.json"])).toEqual([]);
});

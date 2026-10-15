import { expect, test } from "@jest/globals";
import { validateWorkflowStepFields } from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/step/fields.mjs";

test("accepts approved step shapes and null entries", () => {
  expect(
    validateWorkflowStepFields([
      { uses: "actions/checkout@v6" },
      { uses: "actions/setup-node@v7", with: {} },
      { run: "npm test" },
      null,
    ]),
  ).toEqual([]);
});

test("accepts full history for checks that need repository tags", () => {
  expect(
    validateWorkflowStepFields([{ uses: "actions/checkout@v6", with: { "fetch-depth": 0 } }]),
  ).toEqual([]);
});

test("allows arbitrary fields on steps after the required npm test", () => {
  expect(
    validateWorkflowStepFields([
      { uses: "actions/checkout@v6" },
      { uses: "actions/setup-node@v7", with: {} },
      { run: "npm -g install npm@latest" },
      { run: "npm ci" },
      { run: "npm test" },
      { uses: "vendor/action@v1", with: { token: "secret" }, if: "always()" },
    ]),
  ).toEqual([]);
});

test.each([
  { uses: "actions/checkout@v6", name: "checkout" },
  { uses: "actions/setup-node@v7", name: "setup" },
  { run: "npm test", name: "test" },
])("rejects unsupported fields in a step", (step) => {
  expect(validateWorkflowStepFields([step])).toEqual([
    "ci.yaml steps must use only approved keys and inputs.",
  ]);
});

test.each([{ "fetch-depth": 1 }, { token: "secret" }, {}, null])(
  "rejects unsupported checkout inputs %j",
  (withValue) => {
    expect(validateWorkflowStepFields([{ uses: "actions/checkout@v6", with: withValue }])).toEqual([
      "ci.yaml checkout may set only fetch-depth: 0.",
    ]);
  },
);

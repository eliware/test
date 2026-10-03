import { expect, test } from "@jest/globals";
import { isSupportedWorkflowAction } from "../../../../../src/checks/general/E-0.1/E-0.1.24/is-supported-workflow-action.mjs";

test("accepts approved checkout and setup-node inputs", () => {
  expect(isSupportedWorkflowAction({ uses: "actions/checkout@v6" })).toBe(true);
  expect(isSupportedWorkflowAction({ uses: "actions/checkout@v6", with: {} })).toBe(true);
  expect(
    isSupportedWorkflowAction({
      uses: "actions/setup-node@v7",
      with: { "node-version": 26, cache: "npm" },
    }),
  ).toBe(true);
  expect(
    isSupportedWorkflowAction({
      uses: "actions/setup-node@v7.1.2",
      with: {
        "node-version": "26",
        "registry-url": "https://registry.npmjs.org",
        "package-manager-cache": false,
      },
    }),
  ).toBe(true);
});

test.each([
  { uses: "actions/checkout@v6", with: { repository: "attacker/other" } },
  { uses: "actions/checkout@v6", with: { ref: "other-branch" } },
  { uses: "actions/setup-node@v7", with: { "node-version": 20 } },
  {
    uses: "actions/setup-node@v7",
    with: { "node-version": 26, "node-version-file": ".nvmrc" },
  },
  {
    uses: "actions/setup-node@v7",
    with: { "node-version": 26, "registry-url": "https://evil.invalid" },
  },
  { uses: "actions/setup-node@v6", with: { "node-version": 26 } },
  { uses: "actions/setup-node@v7", with: [] },
])("rejects unsupported action settings %#", (step) => {
  expect(isSupportedWorkflowAction(step)).toBe(false);
});

test("ignores non-action steps", () => {
  expect(isSupportedWorkflowAction({ run: "npm ci" })).toBe(true);
  expect(isSupportedWorkflowAction(null)).toBe(true);
  expect(isSupportedWorkflowAction({ uses: null })).toBe(false);
});

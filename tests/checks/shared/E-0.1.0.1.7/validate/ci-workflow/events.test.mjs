import { expect, test } from "@jest/globals";
import { validateCiWorkflowEvents } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/ci-workflow/events.mjs";

const events = {
  push: { branches: ["main"] },
  pull_request: { branches: ["main"] },
};
const concurrency = {
  group: "${{ github.repository }}-${{ github.ref }}",
  "cancel-in-progress": true,
};

test("accepts canonical workflow events and concurrency", () => {
  expect(validateCiWorkflowEvents({ on: events, concurrency })).toEqual([]);
});

test("rejects unsupported events and branch settings", () => {
  expect(
    validateCiWorkflowEvents({
      on: { ...events, schedule: [] },
      concurrency,
      unsupported: true,
    }),
  ).toEqual(
    expect.arrayContaining([
      "ci.yaml must define only push and pull_request events.",
      "ci.yaml workflow has unsupported keys: unsupported.",
    ]),
  );
});

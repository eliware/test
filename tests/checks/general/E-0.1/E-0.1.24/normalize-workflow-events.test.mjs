import { expect, test } from "@jest/globals";
import { normalizeWorkflowEvents } from "../../../../../src/checks/general/E-0.1/E-0.1.24/normalize-workflow-events.mjs";

test("normalizes event strings, arrays, and YAML boolean-key aliases", () => {
  expect(normalizeWorkflowEvents({ on: "push" }).events).toEqual({ push: {} });
  expect(normalizeWorkflowEvents({ true: ["push", "pull_request"] }).events).toEqual({ push: {}, pull_request: {} });
  expect(normalizeWorkflowEvents({ on: { push: {}, pull_request: {} } }).events).toEqual({ push: {}, pull_request: {} });
});

test("returns an empty event map for absent or malformed documents", () => {
  expect(normalizeWorkflowEvents(null)).toEqual({ document: null, events: {} });
  expect(normalizeWorkflowEvents({})).toEqual({ document: { on: undefined, jobs: {} }, events: {} });
  expect(normalizeWorkflowEvents({ on: 7 }).events).toBe(7);
});

import { expect, test } from "@jest/globals";
import { normalizeWorkflowEvents } from "../../../../../src/checks/general/E-0.1/E-0.1.24/normalize-workflow-events.mjs";

test("normalizes event strings, arrays, and YAML boolean-key aliases", () => {
  expect(normalizeWorkflowEvents({ on: "push" }).events).toEqual({ push: {} });
  expect(normalizeWorkflowEvents({ true: ["push", "pull_request"] }).events).toEqual({ push: {}, pull_request: {} });
  expect(normalizeWorkflowEvents({ on: { push: {}, pull_request: {} } }).events).toEqual({ push: {}, pull_request: {} });
});

test("returns an empty event map for absent or malformed documents", () => {
  expect(normalizeWorkflowEvents(null)).toEqual({ document: null, events: {}, valid: false });
  expect(normalizeWorkflowEvents({})).toEqual({
    document: { on: undefined, jobs: {} },
    events: {},
    valid: true,
  });
});

test("rejects malformed scalar trigger maps and event configurations", () => {
  expect(normalizeWorkflowEvents({ on: 7 }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: true }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: ["push", 7] }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: "main", pull_request: {} } }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: false, pull_request: {} } }).valid).toBe(false);
});

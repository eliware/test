import { expect, test } from "@jest/globals";
import { normalizeWorkflowEvents } from "../../../../../src/checks/general/E-0.1/E-0.1.24/normalize-workflow-events.mjs";

test("normalizes event strings, arrays, and YAML boolean-key aliases", () => {
  expect(normalizeWorkflowEvents({ on: "push" }).events).toEqual({ push: {} });
  expect(normalizeWorkflowEvents({ true: ["push", "pull_request"] }).events).toEqual({
    push: {},
    pull_request: {},
  });
  expect(normalizeWorkflowEvents({ on: { push: {}, pull_request: {} } }).events).toEqual({
    push: {},
    pull_request: {},
  });
});

test("accepts mapping configurations and nested activity-type arrays for other events", () => {
  expect(
    normalizeWorkflowEvents({
      on: {
        push: { branches: ["main"] },
        pull_request: { branches: ["main"] },
        workflow_dispatch: { inputs: { deploy: { type: "boolean" } } },
        label: { types: ["created"] },
      },
    }).valid,
  ).toBe(true);
  expect(normalizeWorkflowEvents({ on: { push: null } })).toMatchObject({
    events: { push: {} },
    valid: true,
  });
  expect(normalizeWorkflowEvents({ on: { workflow_dispatch: ["inputs"] } }).valid).toBe(false);
});

test("allows top-level event-name arrays and normalizes push branch shorthand", () => {
  expect(normalizeWorkflowEvents({ on: ["push", "pull_request"] }).valid).toBe(true);
  expect(normalizeWorkflowEvents({ on: { push: ["main"] } })).toMatchObject({
    events: { push: { branches: ["main"] } },
    valid: true,
  });
});

test("returns an invalid empty event map for absent or malformed documents", () => {
  expect(normalizeWorkflowEvents(null)).toEqual({ document: null, events: {}, valid: false });
  expect(normalizeWorkflowEvents({})).toEqual({
    document: { on: undefined, jobs: {} },
    events: {},
    valid: false,
  });
  expect(normalizeWorkflowEvents({ on: {} }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: [] }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: "" }).valid).toBe(false);
});

test("rejects malformed scalar trigger maps and event configurations", () => {
  expect(normalizeWorkflowEvents({ on: 7 }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: true }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: ["push", 7] }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: "main", pull_request: {} } }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: false, pull_request: {} } }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: [], pull_request: {} } }).valid).toBe(false);
  expect(
    normalizeWorkflowEvents({ on: { push: { branches: ["main"] }, pull_request: [] } }).valid,
  ).toBe(false);
  expect(normalizeWorkflowEvents({ on: { push: ["main"] } }).valid).toBe(true);
  expect(normalizeWorkflowEvents({ on: { push: ["main", 7] } }).valid).toBe(false);
  expect(normalizeWorkflowEvents({ on: { pull_request: ["main"] } }).valid).toBe(true);
  expect(normalizeWorkflowEvents({ on: { push: null } })).toMatchObject({
    events: { push: {} },
    valid: true,
  });
});

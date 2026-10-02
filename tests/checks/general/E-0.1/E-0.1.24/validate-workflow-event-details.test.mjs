import { expect, test } from "@jest/globals";
import { isValidEventDetails } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-event-details.mjs";

test("validates workflow dispatch input metadata and choices", () => {
  expect(
    isValidEventDetails("workflow_dispatch", "inputs", {
      deploy: { description: "Deploy environment", required: true, type: "environment" },
      region: { type: "choice", options: ["east", "west"], default: "east" },
      dry_run: { type: "boolean", required: false },
      attempts: { type: "number", default: 3 },
    }),
  ).toBe(true);
  expect(isValidEventDetails("workflow_dispatch", "inputs", { invalid: { type: "choice" } })).toBe(
    false,
  );
  expect(
    isValidEventDetails("workflow_dispatch", "inputs", {
      invalid: { type: "boolean", default: "true" },
    }),
  ).toBe(false);
  expect(
    isValidEventDetails("workflow_dispatch", "inputs", {
      invalid: { type: "choice", default: "north", options: ["east", "west"] },
    }),
  ).toBe(false);
  expect(
    isValidEventDetails("workflow_dispatch", "inputs", {
      invalid: { type: "choice", options: ["valid"], unknown: true },
    }),
  ).toBe(false);
  for (const invalidInput of [
    { description: 7 },
    { required: "true" },
    { type: "number", default: "3" },
    { type: "unknown" },
    { type: "choice", options: ["same", "same"] },
    { type: "number", default: Number.NaN },
  ]) {
    expect(isValidEventDetails("workflow_dispatch", "inputs", { invalid: invalidInput })).toBe(
      false,
    );
  }
});

test("validates reusable workflow inputs, outputs, and secrets", () => {
  expect(
    isValidEventDetails("workflow_call", "inputs", {
      release: { description: "Release tag", required: true, type: "string" },
    }),
  ).toBe(true);
  expect(isValidEventDetails("workflow_call", "inputs", { invalid: { required: true } })).toBe(
    false,
  );
  expect(
    isValidEventDetails("workflow_call", "inputs", {
      invalid: { type: "choice", default: "x" },
    }),
  ).toBe(false);
  expect(
    isValidEventDetails("workflow_call", "outputs", {
      release_url: { description: "Published URL", value: "${{ jobs.release.outputs.url }}" },
    }),
  ).toBe(true);
  expect(
    isValidEventDetails("workflow_call", "outputs", { invalid: { description: "missing value" } }),
  ).toBe(false);
  for (const invalidOutput of [
    { value: "${{ jobs.x.outputs.y }}", unknown: true },
    { value: "" },
    { value: "ok", description: 9 },
  ]) {
    expect(isValidEventDetails("workflow_call", "outputs", { invalid: invalidOutput })).toBe(false);
  }
  expect(isValidEventDetails("workflow_call", "outputs", { "bad name": { value: "ok" } })).toBe(
    false,
  );
  expect(isValidEventDetails("workflow_call", "outputs", { output: null })).toBe(false);
  expect(
    isValidEventDetails("workflow_call", "secrets", {
      token: { description: "Authentication", required: true },
    }),
  ).toBe(true);
  expect(isValidEventDetails("workflow_call", "secrets", { token: { required: "true" } })).toBe(
    false,
  );
  expect(isValidEventDetails("workflow_call", "secrets", { "bad name": {} })).toBe(false);
  expect(isValidEventDetails("workflow_call", "secrets", { token: { value: "extra" } })).toBe(
    false,
  );
});

test("rejects invalid event details and identifiers", () => {
  expect(isValidEventDetails("workflow_dispatch", "outputs", {})).toBe(false);
  expect(isValidEventDetails("workflow_dispatch", "inputs", [])).toBe(false);
  expect(isValidEventDetails("workflow_dispatch", "inputs", { "bad name": {} })).toBe(false);
});

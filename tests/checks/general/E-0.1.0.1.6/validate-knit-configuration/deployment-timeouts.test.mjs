import { expect, test } from "@jest/globals";
import { validateDeploymentTimeouts } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/deployment-timeouts.mjs";

test("requires push deployments and the canonical timeout", () => {
  expect(validateDeploymentTimeouts({ on: { push: { deployments: [] } } })).toContain(
    ".knit/deploy.yaml must define push deployments.",
  );
  expect(
    validateDeploymentTimeouts({ on: { push: { deployments: [{ timeoutMs: 1 }] } } }),
  ).toContain(".knit/deploy.yaml deployment 1 must set timeoutMs to 300000.");
  expect(
    validateDeploymentTimeouts({ on: { push: { deployments: [{ timeoutMs: 300000 }] } } }),
  ).toEqual([]);
});

test("checks timeout values for each tag deployment", () => {
  expect(
    validateDeploymentTimeouts({
      on: { push: { deployments: [{ timeoutMs: 300000 }] }, tags: { "v*": { deployments: [{}] } } },
    }),
  ).toContain(".knit/deploy.yaml tag v* deployment 1 must set timeoutMs to 300000.");
});

test("ignores tag actions without deployment lists", () => {
  expect(
    validateDeploymentTimeouts({
      on: { push: { deployments: [{ timeoutMs: 300000 }] }, tags: { v1: { deployments: "none" } } },
    }),
  ).toEqual([]);
});

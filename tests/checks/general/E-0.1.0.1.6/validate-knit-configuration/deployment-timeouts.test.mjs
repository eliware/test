import { expect, test } from "@jest/globals";
import { validateDeploymentTimeouts } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/deployment-timeouts.mjs";

test("checks only declared push deployments and their canonical timeout", () => {
  expect(validateDeploymentTimeouts({})).toEqual([]);
  expect(validateDeploymentTimeouts({ on: { push: { deployments: [] } } })).toEqual([]);
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

test("rejects malformed deployment lists when present", () => {
  expect(validateDeploymentTimeouts({ on: { push: { deployments: {} } } })).toContain(
    ".knit/deploy.yaml push deployments must be an array.",
  );
  expect(
    validateDeploymentTimeouts({ on: { tags: { v1: { deployments: "invalid" } } } }),
  ).toContain(".knit/deploy.yaml tag v1 deployments must be an array.");
});

test("rejects malformed tag deployment lists and allows tags without deployments", () => {
  const push = { push: { deployments: [{ timeoutMs: 300000 }] } };
  for (const deployments of ["none", {}, null]) {
    expect(
      validateDeploymentTimeouts({
        on: { ...push, tags: { v1: { deployments } } },
      }),
    ).toContain(".knit/deploy.yaml tag v1 deployments must be an array.");
  }
  expect(
    validateDeploymentTimeouts({ on: { ...push, tags: { v1: { deployments: [] } } } }),
  ).toEqual([]);
  expect(validateDeploymentTimeouts({ on: { ...push, tags: { v1: {} } } })).toEqual([]);
});

import { expect, test } from "@jest/globals";
import validateDeploymentTimeouts from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/timeouts.mjs";
test("checks push and tag deployment timeout fields", () => {
  expect(
    validateDeploymentTimeouts({
      on: {
        push: { deployments: [{ timeoutMs: 300000 }, {}] },
        tags: { v1: { deployments: [{ timeoutMs: 1000 }] } },
      },
    }),
  ).toEqual([
    ".knit/deploy.yaml deployment 2 must set timeoutMs to 300000.",
    ".knit/deploy.yaml tag v1 deployment 1 must set timeoutMs to 300000.",
  ]);
});
test("reports invalid deployment collections", () => {
  expect(
    validateDeploymentTimeouts({
      on: { push: { deployments: null }, tags: { v1: { deployments: null } } },
    }),
  ).toEqual([
    ".knit/deploy.yaml push deployments must be an array.",
    ".knit/deploy.yaml tag v1 deployments must be an array.",
  ]);
});
test("ignores absent deployment collections and unrelated tag actions", () => {
  const inherited = Object.create({ deployments: [] });
  expect(
    validateDeploymentTimeouts({ on: { tags: { absent: null, scalar: "release", inherited } } }),
  ).toEqual([]);
});

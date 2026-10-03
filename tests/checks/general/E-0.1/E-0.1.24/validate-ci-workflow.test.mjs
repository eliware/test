import { expect, test } from "@jest/globals";
import { validateCiWorkflow } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-ci-workflow.mjs";

test("requires ci.yaml itself to target main pushes and pull requests", () => {
  expect(validateCiWorkflow([])).toContain("validate pull requests and pushes to main");
  expect(
    validateCiWorkflow([
      { name: "ci.yaml", document: { on: { push: { branches: ["main"] } } } },
      {
        name: "publish.yaml",
        document: {
          on: {
            push: { branches: ["main"] },
            pull_request: { branches: ["main"] },
          },
          jobs: {
            validate: {
              "runs-on": "ubuntu-latest",
              steps: [{ run: "npm ci" }, { run: "npm test" }],
            },
          },
        },
      },
    ]),
  ).toContain("validate pull requests and pushes to main");
});

test("passes when ci.yaml has the required events and validation job", () => {
  expect(
    validateCiWorkflow([
      {
        name: "ci.yaml",
        document: {
          on: {
            push: { branches: ["main"] },
            pull_request: { branches: ["main"] },
          },
          jobs: {
            validate: {
              "runs-on": "ubuntu-latest",
              steps: [{ run: "npm ci" }, { run: "npm test" }],
            },
          },
        },
      },
    ]),
  ).toBeNull();
});

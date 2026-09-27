import { expect, test } from "@jest/globals";
import { dependsOnUbuntuValidation } from "../../../src/checks/ghcr-published/depends-on-ubuntu-validation.mjs";

test("accepts a publication job that needs an Ubuntu npm ci and npm test job", () => {
  const workflow = {
    document: {
      jobs: {
        validate: {
          "runs-on": "ubuntu-latest",
          steps: [{ run: "npm ci" }, { run: "npm test" }],
        },
      },
    },
  };
  expect(dependsOnUbuntuValidation(workflow, { needs: "validate" })).toBe(true);
  expect(dependsOnUbuntuValidation(workflow, { needs: ["other", "validate"] })).toBe(true);
});

test("rejects missing dependencies and validation jobs without Ubuntu", () => {
  const workflow = {
    document: {
      jobs: {
        validate: {
          "runs-on": "windows-latest",
          steps: [{ run: "npm ci" }, { run: "npm test" }],
        },
      },
    },
  };
  expect(dependsOnUbuntuValidation(workflow, {})).toBe(false);
  expect(dependsOnUbuntuValidation(workflow, { needs: "validate" })).toBe(false);
  expect(dependsOnUbuntuValidation({ document: { jobs: {} } }, { needs: "validate" })).toBe(false);
});

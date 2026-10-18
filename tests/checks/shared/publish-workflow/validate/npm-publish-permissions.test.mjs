import { expect, test } from "@jest/globals";
import { validateNpmPublishPermissions } from "../../../../../src/checks/shared/publish-workflow/validate/npm-publish-permissions.mjs";

const validWorkflow = {
  jobs: {
    validate: { permissions: { contents: "read" } },
    publish: { permissions: { contents: "read", "id-token": "write" } },
  },
};

test("accepts OIDC permission on the publish job only", () => {
  expect(validateNpmPublishPermissions(validWorkflow)).toEqual([]);
});

test("requires OIDC permission on the publish job", () => {
  expect(
    validateNpmPublishPermissions({ jobs: { publish: { permissions: { contents: "read" } } } }),
  ).toEqual(["specs/workflows/npm.yaml publish job must grant id-token: write."]);
  expect(validateNpmPublishPermissions({})).toEqual([
    "specs/workflows/npm.yaml publish job must grant id-token: write.",
  ]);
});

test.each([
  [
    { ...validWorkflow, permissions: { "id-token": "write" } },
    "specs/workflows/npm.yaml must not grant id-token: write at the workflow level.",
  ],
  [
    {
      jobs: {
        ...validWorkflow.jobs,
        validate: { permissions: { "id-token": "write" } },
      },
    },
    "specs/workflows/npm.yaml validate job must not grant id-token: write.",
  ],
])("rejects OIDC permission outside the publish job", (workflow, error) => {
  expect(validateNpmPublishPermissions(workflow)).toContain(error);
});

import { expect, test } from "@jest/globals";
import { validateNpmOidcPermissionScope } from "../../../../src/checks/npm-published/E-0.1.140/validate-npm-oidc-permission-scope.mjs";

const publisher = {
  id: "publish",
  job: { permissions: { contents: "read", "id-token": "write" } },
};
const validator = { id: "validate", job: { permissions: { contents: "read" } } };
const workflow = { document: { permissions: { contents: "read" } } };

test("allows OIDC permission only on the publishing job", () => {
  expect(validateNpmOidcPermissionScope(workflow, [publisher], [validator])).toBeNull();
});

test("rejects workflow-level and validation-job OIDC permissions", () => {
  expect(
    validateNpmOidcPermissionScope(
      { document: { permissions: { contents: "read", "id-token": "write" } } },
      [publisher],
      [validator],
    ),
  ).toContain("scoped to the npm publication job");
  expect(
    validateNpmOidcPermissionScope(
      workflow,
      [publisher],
      [{ job: { permissions: { "id-token": "write" } } }],
    ),
  ).toContain("validation jobs");
});

test("rejects workflow-level write-all permissions", () => {
  expect(
    validateNpmOidcPermissionScope(
      { document: { permissions: "write-all" } },
      [publisher],
      [validator],
    ),
  ).toContain("scoped to the npm publication job");
});

test("requires explicit publishing permission and rejects token-based auth", () => {
  expect(validateNpmOidcPermissionScope(workflow, [{ job: {} }], [validator])).toContain(
    "explicitly grant id-token: write",
  );
  expect(
    validateNpmOidcPermissionScope(
      { document: { env: { NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}" } } },
      [publisher],
      [validator],
    ),
  ).toContain("static npm authentication");
  expect(
    validateNpmOidcPermissionScope(
      {
        document: {
          jobs: {
            publish: {
              steps: [
                {
                  env: {
                    "npm_config_//registry.npmjs.org/:_auth": "${{ secrets.PUBLISH_CREDENTIAL }}",
                  },
                },
              ],
            },
          },
        },
      },
      [publisher],
      [validator],
    ),
  ).toContain("static npm authentication");
});

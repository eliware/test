import { expect, test } from "@jest/globals";
import {
  releaseTagFilter,
  releaseTagGuard,
} from "../../../../src/checks/ghcr-published/release-version-tag.mjs";
import { validateNpmPublicationWorkflow } from "../../../../src/checks/npm-published/E-0.1.140/validate-npm-publication-workflow.mjs";

function workflow(tag = releaseTagFilter) {
  return {
    document: {
      on: { push: { tags: [tag] } },
      jobs: {
        validate: {
          "runs-on": "ubuntu-latest",
          steps: [{ run: "npm ci" }, { run: "npm test" }],
        },
        publish: {
          "runs-on": "ubuntu-latest",
          needs: "validate",
          steps: [{ run: releaseTagGuard }, { run: "npm publish" }],
        },
      },
    },
  };
}

test("accepts the exact release trigger and a package-matching version tag", () => {
  expect(validateNpmPublicationWorkflow(workflow(), "1.2.3", { GITHUB_REF_TYPE: "branch" })).toBe(
    true,
  );
  expect(
    validateNpmPublicationWorkflow(workflow(), "1.2.3", {
      GITHUB_REF_TYPE: "tag",
      GITHUB_REF_NAME: "v1.2.3",
    }),
  ).toBe(true);
});

test("rejects an inexact trigger, mismatched release tag, or missing package version", () => {
  expect(validateNpmPublicationWorkflow(workflow("v*.*.*"), "1.2.3", {})).toBe(false);
  expect(
    validateNpmPublicationWorkflow(workflow(), "1.2.3", {
      GITHUB_REF_TYPE: "tag",
      GITHUB_REF_NAME: "v1.2.4",
    }),
  ).toBe(false);
  expect(validateNpmPublicationWorkflow(workflow(), undefined, {})).toBe(false);
});

test("does not require consumer smoke in the routine publication validation job", () => {
  expect(validateNpmPublicationWorkflow(workflow(), "1.2.3", {})).toBe(true);
});

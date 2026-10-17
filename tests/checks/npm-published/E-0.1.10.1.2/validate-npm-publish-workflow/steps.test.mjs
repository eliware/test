import { expect, test } from "@jest/globals";
import { npmPublishWorkflow } from "../../../../../test-fixtures/npm-publish-workflow.mjs";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";
import { parseBoundedYamlDocuments } from "../../../../../src/validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { validateNpmPublishSteps } from "../../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow/steps.mjs";

const document = parseBoundedYamlDocuments(
  npmPublishWorkflow,
  ".github/workflows/publish.yaml",
)[0].toJS();

test("accepts the canonical setup, install, guarded publish sequence", () => {
  expect(validateNpmPublishSteps(document, packageVersion)).toEqual([]);
});

test("reports a missing publish job step list", () => {
  expect(validateNpmPublishSteps({ jobs: { publish: {} } }, packageVersion)).toEqual([
    "publish.yaml publish job must define steps.",
  ]);
});

test("rejects incorrect install order and publish step shape", () => {
  const invalid = structuredClone(document);
  const steps = invalid.jobs.publish.steps;
  const installIndex = steps.findIndex((step) => step.run === "npm -g install npm@latest");
  const ciIndex = steps.findIndex((step) => step.run === "npm ci");
  [steps[installIndex], steps[ciIndex]] = [steps[ciIndex], steps[installIndex]];
  const publish = steps.find((step) => step.run === "npm publish --provenance");
  publish.env = { CI: true };
  expect(validateNpmPublishSteps(invalid, packageVersion)).toEqual(
    expect.arrayContaining([
      "npm publisher must install npm latest before npm ci after setup-node.",
      "npm publisher must have one unconditional standalone npm publish --provenance step.",
    ]),
  );
});

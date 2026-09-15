import { expect, test } from "@jest/globals";
import { hasExactTagTrigger, hasUbuntuRunner, permissions, validationJobs } from "../../../src/checks/ghcr-published/workflow-policy.mjs";

test("classifies workflow validation policy", () => {
  const workflow = { content: "runs-on: ubuntu-latest", document: { on: { push: { tags: ["v*.*.*"] } }, permissions: { contents: "read" }, jobs: { ci: { "runs-on": "ubuntu-latest", steps: [{ run: "npm ci" }, { run: "npm test" }] } } } };
  expect(hasExactTagTrigger(workflow)).toBe(true);
  expect(validationJobs(workflow)).toHaveLength(1);
  expect(hasUbuntuRunner(workflow, workflow.document.jobs.ci)).toBe(true);
  expect(permissions(workflow, {})).toEqual({ contents: "read" });
});

test("handles alternate triggers, runners, permissions, and validation jobs", () => {
  const alternate = {
    content: "runs-on: ubuntu-24.04",
    document: {
      true: { push: { tags: ["other"] } },
      jobs: {
        publish: {
          runsOn: "ubuntu-latest",
          permissions: { packages: "write" },
          steps: [
            { uses: "docker/build-push-action@v6", with: { tags: "x" } },
            { with: { subjectName: "name", subjectDigest: "sha256:x" } },
            { run: "npm publish" },
          ],
        },
      },
    },
  };
  expect(hasExactTagTrigger(alternate)).toBe(false);
  expect(validationJobs(alternate)).toHaveLength(0);
  expect(hasUbuntuRunner(alternate, alternate.document.jobs.publish)).toBe(true);
  expect(permissions(alternate, alternate.document.jobs.publish)).toEqual({ packages: "write" });
  expect(permissions({ document: {} }, {})).toEqual({});
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["other"] } } } })).toBe(false);
  expect(validationJobs({ document: { jobs: {
    ciOnly: { steps: [{ run: "npm ci" }] },
    testOnly: { steps: [{ run: "npm test" }] },
    nullStep: { steps: [{ run: "npm ci" }, { run: null }] },
  } } })).toHaveLength(0);
});

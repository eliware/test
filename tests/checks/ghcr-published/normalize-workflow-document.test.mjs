import { expect, test } from "@jest/globals";
import { normalizeWorkflowDocument } from "../../../src/checks/ghcr-published/normalize-workflow-document.mjs";

test("normalizes YAML parser and workflow field aliases at the boundary", () => {
  expect(normalizeWorkflowDocument({
    true: { push: {} },
    jobs: {
      build: {
        runsOn: "ubuntu-latest",
        steps: [{ with: { "subject-name": "image", "subject-digest": "digest", "push-to-registry": true } }],
      },
    },
  })).toEqual({
    true: { push: {} },
    on: { push: {} },
    jobs: {
      build: {
        runsOn: "ubuntu-latest",
        "runs-on": "ubuntu-latest",
        steps: [{ with: { "subject-name": "image", "subject-digest": "digest", "push-to-registry": true, subjectName: "image", subjectDigest: "digest", pushToRegistry: true } }],
      },
    },
  });
});

test("preserves invalid or absent workflow shapes without inventing fields", () => {
  expect(normalizeWorkflowDocument(null)).toBeNull();
  expect(normalizeWorkflowDocument({ jobs: null })).toEqual({ jobs: {}, on: undefined });
  expect(normalizeWorkflowDocument({ jobs: { empty: null, scalar: "x", existing: { "runs-on": "windows", steps: null }, plain: { steps: [{}, null, { with: null }, { with: { subjectName: "kept" } }] } } })).toMatchObject({
    jobs: {
      empty: null,
      scalar: "x",
      existing: { "runs-on": "windows", steps: null },
      plain: { steps: [{}, null, { with: null }, { with: { subjectName: "kept" } }] },
    },
  });
});

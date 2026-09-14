import { expect, test } from "@jest/globals";
import { hasRun, isPublicationWorkflow, npmPublicationJobs, publicationJobs } from "../../../src/checks/ghcr-published/workflow-publication.mjs";

test("classifies publication and command semantics", () => {
  const workflow = { document: { jobs: { publish: { steps: [{ run: "docker push ghcr.io/example" }, { run: "npm publish" }] } } } };
  expect(isPublicationWorkflow(workflow)).toBe(true);
  expect(hasRun(workflow, /npm publish/)).toBe(true);
  expect(npmPublicationJobs(workflow)).toHaveLength(1);
  expect(publicationJobs(workflow)).toHaveLength(1);
});

test("handles alternate publication and command shapes", () => {
  const alternate = {
    document: {
      jobs: {
        publish: {
          steps: [
            { uses: "docker/build-push-action@v6", with: { tags: "x" } },
            { with: { subjectName: "name", subjectDigest: "sha256:x" } },
            { run: "npm publish" },
          ],
        },
      },
    },
  };
  expect(isPublicationWorkflow(alternate, "docker")).toBe(true);
  expect(isPublicationWorkflow(alternate, /never/)).toBe(false);
  expect(hasRun(alternate, /missing/)).toBe(false);
  expect(npmPublicationJobs(alternate)).toHaveLength(1);
  expect(publicationJobs(alternate)).toHaveLength(1);
  expect(npmPublicationJobs({ document: { jobs: { empty: { steps: [{ run: "npm test" }] } } } })).toHaveLength(0);
});

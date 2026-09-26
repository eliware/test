import { expect, test } from "@jest/globals";
import { isPublicationWorkflow, publicationJobs } from "../../../src/checks/ghcr-published/workflow-publication.mjs";

test("classifies publication and command semantics", () => {
  const workflow = { document: { jobs: { publish: { steps: [{ run: "docker push ghcr.io/example" }, { run: "npm publish" }] } } } };
  expect(isPublicationWorkflow(workflow)).toBe(true);
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
  expect(publicationJobs(alternate)).toHaveLength(1);
});

import { expect, test } from "@jest/globals";
import { npmPublicationJobs } from "../../../src/checks/npm-published/npm-publication-jobs.mjs";

test("selects jobs that publish npm packages", () => {
  const workflow = {
    document: {
      jobs: {
        publish: { steps: [{ run: "npm publish --provenance" }] },
        validate: { steps: [{ uses: "actions/checkout@v4" }, { run: "npm test" }] },
      },
    },
  };

  expect(npmPublicationJobs(workflow)).toEqual([{ id: "publish", job: workflow.document.jobs.publish }]);
});

test("ignores workflows without npm publication jobs", () => {
  expect(npmPublicationJobs({ document: { jobs: { validate: { steps: [{ run: "npm test" }] } } } })).toEqual([]);
});

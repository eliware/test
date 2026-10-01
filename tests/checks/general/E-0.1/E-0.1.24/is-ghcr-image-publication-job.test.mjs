import { expect, test } from "@jest/globals";
import { isGhcrImagePublicationJob } from "../../../../../src/checks/general/E-0.1/E-0.1.24/is-ghcr-image-publication-job.mjs";

test("recognizes a GHCR image push action", () => {
  expect(
    isGhcrImagePublicationJob({
      steps: [{ uses: "docker/build-push-action@v6", with: { push: true } }],
    }),
  ).toBe(true);
});

test("does not classify other steps or non-push builds as publication", () => {
  expect(isGhcrImagePublicationJob({ steps: [{ uses: "actions/checkout@v6" }] })).toBe(false);
  expect(
    isGhcrImagePublicationJob({
      steps: [{ uses: "docker/build-push-action@v6", with: { push: false } }],
    }),
  ).toBe(false);
  expect(isGhcrImagePublicationJob({})).toBe(false);
});

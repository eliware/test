import { expect, test } from "@jest/globals";
import { findProfilePublicationJobIds } from "../../../../../src/checks/general/E-0.1/E-0.1.24/find-profile-publication-job-ids.mjs";

test("selects publication jobs only for their declared profiles", () => {
  const workflow = {
    document: {
      jobs: {
        npm: { steps: [{ run: "npm publish --provenance" }] },
        ghcr: { steps: [{ run: "docker push ghcr.io/eliware/app" }] },
      },
    },
  };
  expect(findProfilePublicationJobIds(workflow)).toEqual(new Set());
  expect(findProfilePublicationJobIds(workflow, ["npm-published"])).toEqual(new Set(["npm"]));
  expect(findProfilePublicationJobIds(workflow, ["ghcr-published"])).toEqual(new Set(["ghcr"]));
  expect(findProfilePublicationJobIds(workflow, ["npm-published", "ghcr-published"])).toEqual(
    new Set(["npm", "ghcr"]),
  );
});

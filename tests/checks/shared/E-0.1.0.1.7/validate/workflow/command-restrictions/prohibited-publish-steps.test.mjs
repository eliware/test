import { expect, test } from "@jest/globals";
import findProhibitedPublishSteps from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/command-restrictions/prohibited-publish-steps.mjs";

test("reports publication commands", () => {
  expect(findProhibitedPublishSteps([{ run: "npm publish" }])).toEqual([
    "ci.yaml validation job must not publish npm packages or GHCR images.",
  ]);
  expect(findProhibitedPublishSteps([])).toEqual([]);
});

import isProhibitedNpmOrGhcrPublishCommand from "../../../../is/prohibited-npm-or-ghcr-publish-command.mjs";

export default function findProhibitedPublishSteps(steps) {
  return steps
    .filter((step) => isProhibitedNpmOrGhcrPublishCommand(step?.run))
    .map(() => "ci.yaml validation job must not publish npm packages or GHCR images.");
}

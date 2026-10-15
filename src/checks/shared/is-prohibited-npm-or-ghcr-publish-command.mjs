import { isNpmPublishCommand } from "./is-npm-publish-command.mjs";

const publishPatterns = [
  /\b(?:semantic-release|release-it|lerna\s+publish|changesets?\s+publish)\b/iu,
  /\b(?:docker|podman|buildah)\s+push\b[^;\r\n]*(?:\bghcr\.io\/|\$\{?GHCR_[A-Z0-9_]+\}?)/iu,
  /\b(?:docker|podman|buildah)\s+(?:buildx\s+)?build\b[^;\r\n]*--push[^;\r\n]*(?:\bghcr\.io\/|\$\{?GHCR_[A-Z0-9_]+\}?)/iu,
  /\b(?:oras|crane)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
  /\bskopeo\s+copy\b[^;\r\n]*docker:\/\/ghcr\.io\//iu,
];

export function isProhibitedNpmOrGhcrPublishCommand(command) {
  return (
    isNpmPublishCommand(command) ||
    (typeof command === "string" && publishPatterns.some((pattern) => pattern.test(command)))
  );
}

import { isProhibitedNpmOrGhcrPublishCommand } from "../../../shared/is/prohibited-npm-or-ghcr-publish-command.mjs";

const additionalPublishPatterns = [
  /\bgh\s+release\s+(?:create|upload)\b/iu,
  /\b(?:docker|podman|buildah)\s+(?:push\b|(?:buildx\s+)?build\b[^;\r\n]*--push\b)/iu,
  /\b(?:oras|crane)\s+push\b|\bskopeo\s+copy\b/iu,
];

export function hasPackagePublicationCommand(command) {
  return (
    isProhibitedNpmOrGhcrPublishCommand(command) ||
    (typeof command === "string" &&
      additionalPublishPatterns.some((pattern) => pattern.test(command)))
  );
}

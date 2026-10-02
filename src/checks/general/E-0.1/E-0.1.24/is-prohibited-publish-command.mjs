const npmPublishPattern = /(?:^|(?:&&|\|\||[;&|])\s*)npm\s+(?:--[^\s]+\s+)*publish\b/iu;
const ghcrPublishPatterns = [
  /\b(?:docker|podman|buildah)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
  /\b(?:docker|podman|buildah)\s+buildx\s+build\b[^;\r\n]*--push[^;\r\n]*\bghcr\.io\//iu,
  /\b(?:oras|crane)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
  /\bskopeo\s+copy\b[^;\r\n]*docker:\/\/ghcr\.io\//iu,
];

export function isProhibitedPublishCommand(command) {
  if (typeof command !== "string") return false;
  return (
    npmPublishPattern.test(command) || ghcrPublishPatterns.some((pattern) => pattern.test(command))
  );
}

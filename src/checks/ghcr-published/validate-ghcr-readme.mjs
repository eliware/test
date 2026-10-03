import { hasDocumentedLatestAlias } from "./has-documented-latest-alias.mjs";

function usageLines(usage) {
  return String(usage ?? "")
    .split(/\r?\n/u)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*]\s+/u, "")
        .replace(/`/gu, "")
        .toLowerCase(),
    );
}

function hasMarker(lines, marker, value) {
  return lines.some((line) => line === `${marker}: ${value}`.toLowerCase());
}

export function validateGhcrReadme(usage, image, version, supportsLatest) {
  const lines = usageLines(usage);
  const supportedTags = `vMAJOR.MINOR.PATCH${supportsLatest ? ", latest" : ""}`;
  const requirements = [
    ["Image", image],
    ["Pull command", `docker pull ${image}:v${version}`],
    ["Supported tags", supportedTags],
    [
      "Deployment boundary",
      "publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
    ],
  ];
  const errors = requirements
    .filter(([marker, value]) => !hasMarker(lines, marker, value))
    .map(([marker]) => `README Usage section is missing or has an invalid ${marker} marker.`);
  if (supportsLatest && !hasDocumentedLatestAlias(usage))
    errors.push(
      "README Usage section must describe latest as a mutable convenience alias, not an identity.",
    );
  return errors;
}

import { expect, test } from "@jest/globals";
import { validateGhcrReadme } from "../../../src/checks/ghcr-published/validate-ghcr-readme.mjs";

const base = [
  "Image: ghcr.io/eliware/example",
  "Pull command: docker pull ghcr.io/eliware/example:v1.2.3",
  "Supported tags: vMAJOR.MINOR.PATCH",
  "Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
].join("\n");

test("accepts all canonical GHCR README markers", () => {
  expect(validateGhcrReadme(base, "ghcr.io/eliware/example", "1.2.3", false)).toEqual([]);
});

test("treats a missing Usage section as empty content", () => {
  expect(validateGhcrReadme(null, "ghcr.io/eliware/example", "1.2.3", false)).toHaveLength(4);
});

test.each([
  ["image", "Image: ghcr.io/eliware/other", "Image marker"],
  [
    "pull command",
    "Pull command: docker pull ghcr.io/eliware/example:latest",
    "Pull command marker",
  ],
  ["supported tags", "Supported tags: latest", "Supported tags marker"],
  ["deployment boundary", "Deployment boundary: deploy the image.", "Deployment boundary marker"],
])("rejects an invalid %s marker independently", (_name, replacement, error) => {
  const lines = base.split("\n");
  const marker = error.replace(" marker", "");
  const index = lines.findIndex((line) => line.startsWith(`${marker}:`));
  lines[index] = replacement;
  expect(validateGhcrReadme(lines.join("\n"), "ghcr.io/eliware/example", "1.2.3", false)).toEqual([
    `README Usage section is missing or has an invalid ${marker} marker.`,
  ]);
});

test("requires latest support and its mutable-alias boundary only when latest is published", () => {
  expect(validateGhcrReadme(base, "ghcr.io/eliware/example", "1.2.3", true)).toEqual([
    "README Usage section is missing or has an invalid Supported tags marker.",
    "README Usage section must describe latest as a mutable convenience alias, not an identity.",
  ]);
  const latest = `${base.replace("Supported tags: vMAJOR.MINOR.PATCH", "Supported tags: vMAJOR.MINOR.PATCH, latest")}\nlatest is a mutable convenience alias and is never the release or deployment identity.`;
  expect(validateGhcrReadme(latest, "ghcr.io/eliware/example", "1.2.3", true)).toEqual([]);
});

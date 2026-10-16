import { expect, test } from "@jest/globals";
import { isProhibitedNpmOrGhcrPublishCommand } from "../../../../src/checks/shared/is/prohibited-npm-or-ghcr-publish-command.mjs";

test.each([
  "npm publish",
  "pnpm publish",
  "npx --yes npm@latest publish",
  "corepack pnpm@latest publish",
  "npx semantic-release",
  "docker push ghcr.io/eliware/app:latest",
  "docker buildx build --push -t ghcr.io/eliware/app:latest .",
  "podman push $GHCR_IMAGE",
  "oras push ghcr.io/eliware/app:latest",
])("rejects npm and GHCR publication command %s", (command) => {
  expect(isProhibitedNpmOrGhcrPublishCommand(command)).toBe(true);
});

test.each([
  "npm test",
  "gh release create v1.0.0",
  "docker push registry.example/app:latest",
  "codescope all",
])("allows other command %s", (command) => {
  expect(isProhibitedNpmOrGhcrPublishCommand(command)).toBe(false);
});

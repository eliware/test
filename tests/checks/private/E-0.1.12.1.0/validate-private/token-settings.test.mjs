import { expect, test } from "@jest/globals";
import { hasNpmPublicationTokenSetting } from "../../../../../src/checks/private/E-0.1.12.1.0/validate-private/token-settings.mjs";

test.each([
  "NPM_TOKEN=value node publish.mjs",
  "export NODE_AUTH_TOKEN=value",
  "echo $NPM_TOKEN",
  "node publish.mjs --token ${NPM_TOKEN:-default}",
  "node publish.mjs --token ${NODE_AUTH_TOKEN?missing}",
  "node publish.mjs --token ${{ secrets.NPM_TOKEN }}",
])("detects npm publication token setting %s", (command) => {
  expect(hasNpmPublicationTokenSetting(command)).toBe(true);
});

test.each(["npm test", "docker push ghcr.io/example", "echo NPM_TOKEN"])(
  "allows command without a token setting: %s",
  (command) => {
    expect(hasNpmPublicationTokenSetting(command)).toBe(false);
  },
);

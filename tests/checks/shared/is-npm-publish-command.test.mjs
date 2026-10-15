import { expect, test } from "@jest/globals";
import { isNpmPublishCommand } from "../../../src/checks/shared/is-npm-publish-command.mjs";

test.each([
  "npm publish",
  "pnpm publish --access public",
  "npx npm publish",
  "npx --yes npm@latest publish",
  "corepack pnpm publish",
  "corepack pnpm@latest publish",
  "yarn npm publish",
])("detects npm publication command %s", (command) => {
  expect(isNpmPublishCommand(command)).toBe(true);
});

test.each(["npm test", "npm run publish", "docker push ghcr.io/eliware/app"])(
  "allows non-npm-publication command %s",
  (command) => {
    expect(isNpmPublishCommand(command)).toBe(false);
  },
);

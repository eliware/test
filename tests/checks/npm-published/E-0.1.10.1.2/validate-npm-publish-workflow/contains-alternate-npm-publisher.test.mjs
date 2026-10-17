import { expect, test } from "@jest/globals";
import { hasAlternateNpmPublisher } from "../../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow/contains-alternate-npm-publisher.mjs";

test.each([
  ["pnpm publish", true],
  ["yarn npm publish", true],
  ["bun publish", true],
  ["npx npm publish", true],
  ["npm exec -- pnpm publish", true],
  ["npm exec -- yarn npm publish", true],
  ["npm exec --package=pnpm -- pnpm publish", true],
  ["npm exec -- pnpm --version", false],
  ["bash -c 'npm publish --tag latest'", true],
  ["echo 'npm publish'", false],
  ["printf 'npm publish'", false],
  ["npm ci", false],
  ["npm publish --provenance", false],
])("checks run command %s", (run, expected) => {
  expect(hasAlternateNpmPublisher([{ run }])).toBe(expected);
});

test("checks publisher actions and ignores unrelated actions", () => {
  expect(hasAlternateNpmPublisher([{ uses: "JS-DevTools/npm-publish@v3" }])).toBe(true);
  expect(hasAlternateNpmPublisher([{ uses: "actions/checkout@v7" }])).toBe(false);
  expect(hasAlternateNpmPublisher([{}])).toBe(false);
});

test("rejects an npm exec publisher beside the canonical publish step", async () => {
  const steps = [{ run: "npm publish --provenance" }, { run: "npm exec -- pnpm publish" }];
  expect(hasAlternateNpmPublisher(steps)).toBe(true);
});

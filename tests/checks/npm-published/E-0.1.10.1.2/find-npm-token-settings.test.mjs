import { expect, test } from "@jest/globals";
import { findNpmTokenSettings } from "../../../../src/checks/npm-published/E-0.1.10.1.2/find-npm-token-settings.mjs";

test("finds token names and secret references in nested workflow settings", () => {
  expect(
    findNpmTokenSettings({
      env: { NODE_AUTH_TOKEN: "secret" },
      jobs: { publish: { steps: [{ with: { token: "${{ secrets.NPM_TOKEN }}" } }] } },
    }),
  ).toEqual([
    "publish.yaml.env must not define NODE_AUTH_TOKEN.",
    "publish.yaml.jobs.publish.steps.0.with.token must not reference NPM_TOKEN or NODE_AUTH_TOKEN.",
  ]);
});

test("accepts workflow settings without npm token declarations", () => {
  expect(findNpmTokenSettings({ env: { CI: "true" } })).toEqual([]);
});

import { expect, test } from "@jest/globals";
import { hasNpmStaticCredentials } from "../../../../src/checks/npm-published/E-0.1.140/has-npm-static-credentials.mjs";

test("detects npm credentials assigned through registry auth settings", () => {
  expect(
    hasNpmStaticCredentials({
      jobs: {
        publish: {
          steps: [
            {
              env: {
                "npm_config_//registry.npmjs.org/:_auth": "${{ secrets.PUBLISH_CREDENTIAL }}",
              },
            },
          ],
        },
      },
    }),
  ).toBe(true);
});

test("does not classify unrelated GitHub secrets as npm credentials", () => {
  expect(hasNpmStaticCredentials({ env: { DEPLOYMENT_REGION: "${{ secrets.REGION }}" } })).toBe(
    false,
  );
});

test("detects direct npm token references", () => {
  expect(hasNpmStaticCredentials({ env: { NODE_AUTH_TOKEN: "${{ secrets.ANY_NAME }}" } })).toBe(
    true,
  );
});

test("detects secrets assigned to generic token settings recursively", () => {
  expect(hasNpmStaticCredentials({ token: "${{ secrets.PUBLISH_TOKEN }}" })).toBe(true);
});

test("walks array entries and returns false when no auth setting contains a secret", () => {
  expect(hasNpmStaticCredentials([null, { token: "${{ secrets.PUBLISH_TOKEN }}" }])).toBe(true);
  expect(hasNpmStaticCredentials([null, 42])).toBe(false);
  expect(hasNpmStaticCredentials({ token: "literal-token" })).toBe(false);
});

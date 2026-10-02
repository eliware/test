import { expect, test } from "@jest/globals";
import { collectRedactionSecrets } from "../../src/checks/collect-redaction-secrets.mjs";

test("collects unique string values from sensitive environment keys", () => {
  expect(
    collectRedactionSecrets({
      SAFE: "visible",
      SERVICE_TOKEN: "long-secret",
      API_KEY: "short",
      REFRESH_TOKEN: "long-secret",
      EMPTY_SECRET: "",
      NUMERIC_PASSWORD: 123,
    }),
  ).toEqual(["long-secret", "short"]);
});

test("returns no secrets for missing or non-object environments", () => {
  expect(collectRedactionSecrets()).toEqual([]);
  expect(collectRedactionSecrets("TOKEN=value")).toEqual([]);
});

test("collects configured secret values regardless of environment size", () => {
  const environment = Object.fromEntries(
    Array.from({ length: 105 }, (_, index) => [`SERVICE_TOKEN_${index}`, `secret-${index}`]),
  );
  environment.SHORT_TOKEN = "x";

  const secrets = collectRedactionSecrets(environment);
  expect(secrets).toHaveLength(106);
  expect(secrets).toContain("secret-104");
  expect(secrets).toContain("x");
});

test("collects common cloud, GitHub, and npm credential variables", () => {
  expect(
    collectRedactionSecrets({
      AWS_ACCESS_KEY_ID: "aws-key",
      GITHUB_TOKEN: "github-token",
      NPM_AUTH_TOKEN: "npm-auth",
    }),
  ).toEqual(["github-token", "npm-auth", "aws-key"]);
});

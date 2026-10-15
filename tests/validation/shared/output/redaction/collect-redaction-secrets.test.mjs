import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../helpers/project-version.mjs";
import { collectRedactionSecrets } from "../../../../../src/validation/shared/output/redaction/collect-redaction-secrets.mjs";

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
  ).toEqual(["long-secret"]);
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
  expect(secrets).toHaveLength(105);
  expect(secrets).toContain("secret-104");
  expect(secrets).not.toContain("x");
});

test("collects common cloud, GitHub, and npm credential variables", () => {
  expect(
    collectRedactionSecrets({
      AWS_ACCESS_KEY_ID: "aws-access-key",
      GITHUB_TOKEN: "github-token",
      NPM_AUTH_TOKEN: "npm-auth",
    }),
  ).toEqual(["aws-access-key", "github-token", "npm-auth"]);
});

test("ignores short values that can overlap ordinary command output", () => {
  expect(
    collectRedactionSecrets({
      XDG_SESSION_ID: "1",
      SERVICE_TOKEN: "12",
      API_KEY: packageVersion,
      API_TOKEN: "secret-token-value",
    }),
  ).toEqual(["secret-token-value"]);
});

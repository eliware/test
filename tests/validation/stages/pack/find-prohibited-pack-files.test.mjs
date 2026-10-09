import { expect, test } from "@jest/globals";
import { findProhibitedPackFiles } from "../../../../src/validation/stages/pack/find-prohibited-pack-files.mjs";

test("defaults to an empty packed-file list", () => {
  expect(findProhibitedPackFiles()).toEqual([]);
});

test("identifies every prohibited directory, lockfile, config, and secret path", () => {
  const files = [
    "tests/example.test.mjs",
    "test/example.js",
    "nested/__tests__/example.mjs",
    "test-fixtures/sample.json",
    ".github/workflows/ci.yaml",
    ".knit/deploy.yaml",
    ".git/config",
    ".gitignore",
    "public/.gitignore",
    "public/nested/.gitignore",
    "package-lock.json",
    "nested/npm-shrinkwrap.json",
    "nested/yarn.lock",
    "nested/pnpm-lock.yaml",
    "nested/bun.lock",
    "nested/bun.lockb",
    "nested/.npmrc",
    "node_modules/dep/index.mjs",
    "coverage/coverage-final.json",
    "nested/build/output.js",
    "nested/dist/output.js",
    "assets/generated/output.json",
    "artifacts/release/archive.tgz",
    "test-results/report.json",
    "src/.env",
    "src/.env.development",
    "nested/.env.test",
    "nested/.env.staging",
    "config/secret",
    "config/secrets.json",
    "secrets/private.json",
    "config/credential",
    "config/credentials.json",
    "credentials/certificate.json",
    "config/token",
    "config/tokens.json",
    "tokens/access.txt",
    "src/private-key.pem",
    "keys/signing.key",
    "keys/certificate.p12",
    "keys/certificate.pfx",
  ];
  expect(findProhibitedPackFiles(files)).toEqual(files);
});

test("permits ordinary runtime files and placeholder environment examples", () => {
  expect(
    findProhibitedPackFiles([
      "src/index.mjs",
      "docs/README.md",
      "AGENTS.md",
      ".env.example",
      ".env.development.example",
      "nested/.env.production.example",
      "examples/demo.mjs",
      "src/redact-secrets.mjs",
      "src/collect-redaction-secrets.mjs",
      "src/secrets.ts",
      "src/token.mjs",
    ]),
  ).toEqual([]);
});

import { expect, test } from "@jest/globals";
import { findProhibitedPackFiles } from "../../../../src/orchestration/npm-published/E-0.1.140/find-prohibited-pack-files.mjs";

test("defaults to an empty packed-file list", () => {
  expect(findProhibitedPackFiles()).toEqual([]);
});

test("identifies prohibited tests, tooling, generated files, secrets, and real env files", () => {
  const files = [
    "tests/example.test.mjs",
    ".github/workflows/ci.yaml",
    ".knit/deploy.yaml",
    "package-lock.json",
    "node_modules/dep/index.mjs",
    "coverage/coverage-final.json",
    "src/.env",
    "src/private-key.pem",
    "config/credentials.json",
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
      "examples/demo.mjs",
      "src/redact-secrets.mjs",
      "src/collect-redaction-secrets.mjs",
    ]),
  ).toEqual([]);
});

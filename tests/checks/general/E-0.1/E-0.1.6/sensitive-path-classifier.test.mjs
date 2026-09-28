import { expect, test } from "@jest/globals";
import {
  isForbiddenPath,
  sensitivePathRole,
} from "../../../../../src/checks/general/E-0.1/E-0.1.6/sensitive-path-classifier.mjs";

test("classifies sensitive paths with exact benign-file exceptions", () => {
  expect(isForbiddenPath("credentials.json")).toBe(true);
  expect(isForbiddenPath("private-conversations.json")).toBe(true);
  expect(isForbiddenPath("database-state.sqlite")).toBe(true);
  expect(isForbiddenPath("production.dump")).toBe(true);
  expect(isForbiddenPath("id_ed25519")).toBe(true);
  expect(isForbiddenPath("src/private-key.mjs")).toBe(true);
  expect(isForbiddenPath("src/checks/collect-redaction-secrets.mjs")).toBe(false);
  expect(isForbiddenPath("src/checks/create-partial-secret-suffix-trimmer.mjs")).toBe(false);
  expect(isForbiddenPath("tests/checks/create-partial-secret-suffix-trimmer.test.mjs")).toBe(false);
  expect(isForbiddenPath("tests/checks/redact-credential-fields.test.mjs")).toBe(false);
  expect(isForbiddenPath("src/checks/create-secret-text-matcher.mjs.pem")).toBe(true);
  expect(isForbiddenPath("tests/checks/redact-credential-fields.test.mjs.key")).toBe(true);
  expect(isForbiddenPath("src/reference-registration-key.mjs")).toBe(true);
  expect(isForbiddenPath("other/collect-redaction-secrets.mjs")).toBe(true);
  expect(isForbiddenPath(".env.example")).toBe(false);
  expect(isForbiddenPath(".env.local")).toBe(true);
  expect(isForbiddenPath("config/.env.example")).toBe(true);
  expect(isForbiddenPath("docs/readme.md")).toBe(false);
  expect(isForbiddenPath("nested\\credentials.pem")).toBe(true);
});

test("identifies exact encrypted secret and management metadata roles", () => {
  expect(sensitivePathRole("secrets/api.enc.yaml")).toBe("encrypted-secret");
  expect(sensitivePathRole("infrastructure/app/secrets/ksops-generator.yaml")).toBe("generator");
  expect(sensitivePathRole("infrastructure/app-secrets/kustomization.yaml")).toBe("kustomization");
  expect(sensitivePathRole("clusters/prod/argocd-apps/app-secrets.yaml")).toBe("application");
  expect(sensitivePathRole("secrets/README.md")).toBe("documentation");
  expect(sensitivePathRole("secrets/api.yaml")).toBe(null);
});

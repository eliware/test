import { expect, test } from "@jest/globals";
import hasGhcrPublisherPermissions from "../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/workflow-permissions.mjs";
import hasGhcrValidationReadPermissions from "../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/workflow-permissions/has-ghcr/validation-read-permissions.mjs";
import hasGhcrWorkflowReadPermissions from "../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/workflow-permissions/has-ghcr/workflow-read-permissions.mjs";
const publisherPermissions = {
  contents: "read",
  packages: "write",
};
test("accepts the exact GHCR workflow permissions", () => {
  expect(hasGhcrPublisherPermissions(publisherPermissions)).toBe(true);
  expect(
    hasGhcrWorkflowReadPermissions({
      contents: "read",
    }),
  ).toBe(true);
  expect(hasGhcrValidationReadPermissions(undefined)).toBe(true);
  expect(
    hasGhcrValidationReadPermissions({
      contents: "read",
    }),
  ).toBe(true);
});
test("rejects missing, extra, or incorrect permissions", () => {
  expect(
    hasGhcrPublisherPermissions({
      ...publisherPermissions,
      packages: "read",
    }),
  ).toBe(false);
  expect(
    hasGhcrPublisherPermissions({
      ...publisherPermissions,
      extra: "read",
    }),
  ).toBe(false);
  expect(
    hasGhcrPublisherPermissions({
      ...publisherPermissions,
      "id-token": "write",
    }),
  ).toBe(false);
  expect(
    hasGhcrPublisherPermissions({
      ...publisherPermissions,
      attestations: "write",
    }),
  ).toBe(false);
  expect(
    hasGhcrPublisherPermissions({
      ...publisherPermissions,
      "artifact-metadata": "write",
    }),
  ).toBe(false);
  expect(
    hasGhcrWorkflowReadPermissions({
      contents: "read",
      packages: "write",
    }),
  ).toBe(false);
  expect(
    hasGhcrValidationReadPermissions({
      contents: "read",
      packages: "write",
    }),
  ).toBe(false);
});

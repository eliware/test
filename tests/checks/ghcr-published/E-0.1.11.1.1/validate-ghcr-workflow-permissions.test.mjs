import { expect, test } from "@jest/globals";
import {
  hasGhcrPublisherPermissions,
  hasGhcrWorkflowReadPermissions,
} from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr-workflow-permissions.mjs";

const publisherPermissions = {
  contents: "read",
  packages: "write",
  "id-token": "write",
  attestations: "write",
  "artifact-metadata": "write",
};

test("accepts the exact GHCR workflow permissions", () => {
  expect(hasGhcrPublisherPermissions(publisherPermissions)).toBe(true);
  expect(hasGhcrWorkflowReadPermissions({ contents: "read" })).toBe(true);
});

test("rejects missing, extra, or incorrect permissions", () => {
  expect(hasGhcrPublisherPermissions({ ...publisherPermissions, packages: "read" })).toBe(false);
  expect(hasGhcrPublisherPermissions({ ...publisherPermissions, extra: "read" })).toBe(false);
  expect(hasGhcrWorkflowReadPermissions({ contents: "read", packages: "write" })).toBe(false);
});

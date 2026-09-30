import { expect, test } from "@jest/globals";
import {
  expectedPublicationPermissions,
  hasExactPublicationPermissions,
  hasReadOnlyWorkflowPermissions,
} from "../../../src/checks/ghcr-published/expected-publication-permissions.mjs";

test("returns the exact npm and GHCR permission union for combined publication", () => {
  expect(expectedPublicationPermissions(["npm-published", "ghcr-published"])).toEqual({
    contents: "read",
    "id-token": "write",
    packages: "write",
    attestations: "write",
    "artifact-metadata": "write",
  });
});

test("returns only the selected profile permissions", () => {
  expect(expectedPublicationPermissions(["npm-published"])).toEqual({
    contents: "read",
    "id-token": "write",
  });
  expect(expectedPublicationPermissions(["ghcr-published"]).packages).toBe("write");
  expect(expectedPublicationPermissions([])).toEqual({});
  expect(expectedPublicationPermissions(["unknown"])).toEqual({});
  expect(expectedPublicationPermissions()).toEqual({});
});

test("matches exact permission maps without depending on key order", () => {
  expect(
    hasExactPublicationPermissions(
      {
        contents: "read",
        packages: "write",
        "id-token": "write",
        attestations: "write",
        "artifact-metadata": "write",
      },
      ["ghcr-published", "npm-published"],
    ),
  ).toBe(true);
  expect(hasExactPublicationPermissions({ contents: "write" }, ["npm-published"])).toBe(false);
  expect(hasExactPublicationPermissions(null, ["npm-published"])).toBe(false);
  expect(hasExactPublicationPermissions([], ["npm-published"])).toBe(false);
  expect(hasExactPublicationPermissions("read", ["npm-published"])).toBe(false);
  expect(hasExactPublicationPermissions({})).toBe(true);
});

test("requires the workflow-level permission map to be read-only", () => {
  expect(hasReadOnlyWorkflowPermissions({ contents: "read" })).toBe(true);
  expect(hasReadOnlyWorkflowPermissions({ contents: "read", packages: "write" })).toBe(false);
  expect(hasReadOnlyWorkflowPermissions([])).toBe(false);
  expect(hasReadOnlyWorkflowPermissions(undefined)).toBe(false);
});

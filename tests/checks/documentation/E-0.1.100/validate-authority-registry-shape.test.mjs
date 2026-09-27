import { expect, test } from "@jest/globals";
import {
  validateAuthorityRegistryEntryShape,
  validateAuthorityRegistryShape,
} from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-shape.mjs";

test("requires a registry array and repository identity for every entry", () => {
  expect(validateAuthorityRegistryShape(null)).toContain("repositoryRegistry");
  expect(validateAuthorityRegistryShape([{ repository: "one" }])).toBeNull();
});

test("requires every registry entry to declare a string repository", () => {
  expect(validateAuthorityRegistryEntryShape(null, 0)).toBe(
    "repositoryRegistry[0] must declare a repository.",
  );
  expect(validateAuthorityRegistryEntryShape({ repository: 1 }, 1)).toContain(
    "declare a repository",
  );
  expect(validateAuthorityRegistryEntryShape({ repository: "one" }, 2)).toBeNull();
});

test("rejects duplicate repository identities", () => {
  expect(validateAuthorityRegistryShape([{ repository: "one" }, { repository: "one" }])).toBe(
    "Duplicate authority repository: one.",
  );
});

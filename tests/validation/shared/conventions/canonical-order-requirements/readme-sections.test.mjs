import { expect, test } from "@jest/globals";
import { readmeSectionsRequirements } from "../../../../../src/validation/shared/conventions/canonical-order-requirements/readme-sections.mjs";

test("defines README profile sections in canonical profile order", () => {
  expect(readmeSectionsRequirements.fields.profileSections).toBe("text-list-map");
  expect(readmeSectionsRequirements.maps.profileSections).toEqual([
    "application",
    "database",
    "cli",
    "discord",
    "mcp-server",
    "web",
    "library",
    "infrastructure",
    "workspace",
    "documentation",
    "npm-published",
    "ghcr-published",
    "private",
  ]);
});

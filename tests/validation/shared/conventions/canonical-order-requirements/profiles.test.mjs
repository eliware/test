import { expect, test } from "@jest/globals";
import { canonicalProfileOrder } from "../../../../../src/validation/shared/conventions/canonical-order-requirements/profiles.mjs";

test("defines the canonical profile order", () => {
  expect(canonicalProfileOrder).toEqual([
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

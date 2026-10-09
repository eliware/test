import { expect, jest, test } from "@jest/globals";
import { validateDiscordOrdering } from "../../../../src/checks/shared/E-0.1.7.1.0/validate-discord-ordering.mjs";

const agentsOrder = {
  profileOrder: ["application", "cli", "discord", "mcp-server", "web"],
  profileHeadings: { discord: "Discord" },
};
const readmeOrder = {
  profileOrder: ["application", "cli", "discord", "mcp-server", "web"],
  profileSections: {
    discord: ["Events", "Intents and permissions"],
  },
  sharedSections: { Commands: { profiles: ["cli", "discord"] } },
};

test("reads canonical files and accepts the Discord section order", () => {
  const readCanonicalOrder = jest.fn((name) =>
    name === "agents-sections.yaml" ? agentsOrder : readmeOrder,
  );
  expect(validateDiscordOrdering(readCanonicalOrder)).toEqual([]);
  expect(readCanonicalOrder).toHaveBeenCalledWith("agents-sections.yaml");
  expect(readCanonicalOrder).toHaveBeenCalledWith("readme-sections.yaml");
});

test("rejects incorrect Discord heading and section order", () => {
  expect(
    validateDiscordOrdering((name) =>
      name === "agents-sections.yaml"
        ? { ...agentsOrder, profileHeadings: { discord: "Discord Bot" } }
        : { ...readmeOrder, profileSections: { discord: ["Events", "Commands"] } },
    ),
  ).toEqual([
    "Canonical AGENTS.md ordering must place Discord after CLI and before MCP server.",
    "Canonical README.md ordering must list the Discord sections in the required order.",
  ]);
});

test("rejects missing and malformed profile order lists", () => {
  expect(validateDiscordOrdering(() => ({}))).toHaveLength(2);
  expect(validateDiscordOrdering(() => ({ profileOrder: "invalid" }))).toHaveLength(2);
  expect(
    validateDiscordOrdering((name) =>
      name === "agents-sections.yaml"
        ? { ...agentsOrder, profileOrder: [...agentsOrder.profileOrder, "discord"] }
        : readmeOrder,
    ),
  ).toContain("Canonical AGENTS.md ordering must place Discord after CLI and before MCP server.");
});

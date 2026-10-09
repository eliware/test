import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

const profileOrder = ["application", "cli", "discord", "mcp-server"];
const discordSections = ["Events", "Intents and permissions"];

export function validateDiscordOrdering(readOrder = readCanonicalOrder) {
  const agents = readOrder("agents-sections.yaml");
  const readme = readOrder("readme-sections.yaml");
  const errors = [];
  if (agents?.profileHeadings?.discord !== "Discord" || !hasOrderedProfiles(agents.profileOrder))
    errors.push("Canonical AGENTS.md ordering must place Discord after CLI and before MCP server.");
  if (
    !hasOrderedProfiles(readme?.profileOrder) ||
    JSON.stringify(readme.profileSections?.discord) !== JSON.stringify(discordSections) ||
    !readme.sharedSections?.Commands?.profiles?.includes("discord")
  )
    errors.push(
      "Canonical README.md ordering must list the Discord sections in the required order.",
    );
  return errors;
}

function hasOrderedProfiles(profiles = []) {
  if (!Array.isArray(profiles)) return false;
  if (profileOrder.some((profile) => profiles.filter((item) => item === profile).length !== 1))
    return false;
  const indexes = profileOrder.map((profile) => profiles.indexOf(profile));
  return indexes.every(
    (index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]),
  );
}

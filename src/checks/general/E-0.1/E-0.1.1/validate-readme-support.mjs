import { readSection } from "./read-readme-section.mjs";

export function validateReadmeSupport(readme, sections) {
  const content = readSection(readme, "Support", sections);
  const discordBadge =
    "[![discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/m6atr9etwn)";
  const discordLink = "**[eliware.org on discord](https://discord.gg/m6atr9etwn)**";
  if (
    !/^##\s+Support\s*$/imu.test(readme) ||
    !content.includes(`${discordBadge}\n\n${discordLink}`)
  ) {
    return "README.md must include the standard Discord support block.";
  }
  return null;
}

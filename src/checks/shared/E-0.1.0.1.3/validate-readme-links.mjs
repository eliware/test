import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

const requiredLinks = [
  ["Eliware", "https://eliware.org"],
  ["GitHub organization", "https://github.com/eliware"],
  ["Discord", "https://discord.gg/M6aTR9eTwN"],
  ["specifications", "specs/README.md"],
];

export function validateReadmeLinks(readme, packageJson = {}) {
  const markdown = removeMarkdownCode(readme);
  const linksSection = readSection(markdown, "Links");
  const licenseSection = readSection(markdown, "License");
  const supportSection = readSection(markdown, "Support");
  const repository =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  const repo =
    typeof repository === "string"
      ? repository
          .replace(/^git\+/u, "")
          .replace(/\.git$/u, "")
          .replace(/\/$/u, "")
      : "";
  const required = [
    ...requiredLinks,
    ["Home Page", packageJson?.homepage],
    ["GitHub repository", `${repo}.git`],
  ];
  const missing = required.find(
    ([label, target]) => !hasCanonicalLink(linksSection, label, target),
  );
  if (missing) return `README.md Links must include ${missing[0]} with its canonical target.`;
  if (!hasCanonicalLink(licenseSection, "license", "LICENSE"))
    return "README.md License must link the repository LICENSE file.";
  if (
    !supportSection.includes(
      "[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)\n\n**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**",
    )
  )
    return "README.md Support must include the exact Discord support block.";
  return null;
}

function hasCanonicalLink(section, label, target) {
  if (typeof target !== "string" || !target) return false;
  const escapedLabel = escapeRegExp(label);
  const escapedTarget = escapeRegExp(target);
  const inline = new RegExp(`\\[${escapedLabel}\\]\\(${escapedTarget}(?:\\s+[^)]*)?\\)`, "iu");
  if (inline.test(section)) return true;
  const definitions = new Map();
  for (const match of section.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gimu))
    definitions.set(normalizeLabel(match[1]), match[2] ?? match[3]);
  for (const match of section.matchAll(/\[([^\]]+)\](?:\[([^\]]*)\])?/gu)) {
    if (normalizeLabel(match[1]) !== normalizeLabel(label)) continue;
    const reference = normalizeLabel(match[2] || match[1]);
    if (definitions.get(reference) === target) return true;
  }
  const html = new RegExp(
    `<a\\b[^>]*\\bhref=["']${escapedTarget}["'][^>]*>([\\s\\S]*?)<\\/a>`,
    "iu",
  );
  const anchor = html
    .exec(section)?.[1]
    ?.replace(/<[^>]*>/gu, "")
    .trim();
  return anchor === label;
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function readSection(readme, heading) {
  const lines = readme.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `## ${heading}`);
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^##\s+/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n");
}

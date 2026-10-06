import { removeMarkdownCode } from "../E-0.1.0.1.4/extract-markdown-links.mjs";

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
  const links = [...linksSection.matchAll(/\[([^\]]+)\]\(([^)]+)\)/gu)].map((match) => [
    match[1],
    match[2],
  ]);
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
    ([label, target]) => !links.some((link) => link[0] === label && link[1] === target),
  );
  if (missing) return `README.md Links must include ${missing[0]} with its canonical target.`;
  if (!/\[license\]\(LICENSE\)/iu.test(licenseSection))
    return "README.md License must link the repository LICENSE file.";
  if (
    !supportSection.includes(
      "[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)\n\n**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**",
    )
  )
    return "README.md Support must include the exact Discord support block.";
  return null;
}

function readSection(readme, heading) {
  const lines = readme.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `## ${heading}`);
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^##\s+/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n");
}

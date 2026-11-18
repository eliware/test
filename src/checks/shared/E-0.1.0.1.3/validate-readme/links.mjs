import removeMarkdownCode from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import readCanonicalOrder from "../../../../validation/shared/conventions/read-canonical-order.mjs";
import readReadmeSection from "./sections/read.mjs";
export default function validateReadmeLinks(readme, packageJson = {}) {
  const markdown = removeMarkdownCode(readme);
  const order = readCanonicalOrder("readme-sections.yaml");
  const repository = getRepository(packageJson);
  if (!repository) return "package.json must define the canonical GitHub repository.";
  if (
    packageJson?.eliware?.apply?.includes("npm-published") &&
    (typeof packageJson.name !== "string" || !packageJson.name)
  )
    return "package.json.name is required for the npm link.";
  const targets = {
    "Home Page": "https://eliware.org",
    "GitHub Org": "https://github.com/eliware",
    "GitHub Repo": repository,
    "Bug Reports": `${repository}/issues`,
    npm: `https://www.npmjs.com/package/${packageJson.name}`,
    Discord: "https://discord.gg/M6aTR9eTwN",
  };
  const links = order.linksSectionOrder
    .filter((label) => label !== "npm" || packageJson?.eliware?.apply?.includes("npm-published"))
    .map((label) => [label, targets[label]]);
  const expectedLinks = links.map(([label, target]) => `- [${label}](${target})`);
  const linksBody = readReadmeSection(markdown, "Links").trim().split(/\r?\n/u);
  if (JSON.stringify(linksBody) !== JSON.stringify(expectedLinks))
    return "README.md Links must contain only the canonical links in the required order.";
  if (readReadmeSection(markdown, "License").trim() !== order.licenseLink)
    return "README.md License must contain the exact MIT link.";
  if (readReadmeSection(markdown, "Support").trim() !== order.supportBlock)
    return "README.md Support must contain the exact support section.";
  return null;
}
function getRepository(packageJson) {
  const value =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  if (typeof value !== "string") return "";
  const repository = value
    .replace(/^git\+/u, "")
    .replace(/\.git$/u, "")
    .replace(/\/$/u, "");
  return /^https:\/\/github\.com\/eliware\/[\w.-]+$/u.test(repository) ? repository : "";
}

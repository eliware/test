import { removeMarkdownCode } from "../E-0.1.0.1.4/extract-markdown-links.mjs";

export function validateReadmeMetadata(readme, packageJson = {}) {
  const author =
    typeof packageJson?.author === "string" ? packageJson.author : packageJson?.author?.name;
  const values = [packageJson?.description, author, packageJson?.license];
  if (values.some((value) => typeof value !== "string" || !value.trim()))
    return "package.json must define a description, author, and license.";
  const labels = ["description", "author", "license"];
  const markdown = removeMarkdownCode(readme);
  const metadata = new Map(
    [...markdown.matchAll(/^(Package description|Author|License):\s*(.*?)\s*$/gmu)].map((match) => [
      match[1] === "Package description" ? "description" : match[1].toLowerCase(),
      match[2],
    ]),
  );
  const missing = values.flatMap((value, index) =>
    metadata.get(labels[index]) === value ? [] : [labels[index]],
  );
  return missing.length ? `README.md must include exact package ${missing.join(", ")}.` : null;
}

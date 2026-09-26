import { expectedReadmeHeadings } from "./read-readme-sections.mjs";

const STANDARD_BRAND_LINE =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeStructure(readme, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  if (lines[0] !== STANDARD_BRAND_LINE) {
    return "README.md must begin with the standard Eliware branding line.";
  }

  const headings = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^##\s+[^#]/u.test(line));
  const tocIndex =
    headings.find(({ line }) => /^##\s+Table of Contents\s*$/iu.test(line))?.index ?? -1;
  const expected = expectedReadmeHeadings(packageJson);
  const required = expected.slice(1);
  const indices = required.map(
    (heading) =>
      headings.find(({ line }) =>
        new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "iu").test(line),
      )?.index ?? -1,
  );

  if (tocIndex < 0) {
    return "README.md must contain the required top-level headings in order with a Table of Contents.";
  }
  const contentBeforeToc = lines
    .slice(1, tocIndex)
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line }) => line.trim() !== "");
  const titleIndex = headings.find(({ index }) => index < tocIndex)?.index;
  if (
    headings.filter(({ index }) => index < tocIndex).length !== 1 ||
    titleIndex === undefined ||
    contentBeforeToc.some(({ index }) => index !== titleIndex)
  ) {
    return "README.md must place its badge-bearing title immediately before the Table of Contents without intervening content.";
  }

  const missing = required.find((_, index) => indices[index] < 0);
  if (missing)
    return `README.md must include the ${missing === "Links" ? "standard Links" : missing} section.`;

  const actual = headings
    .filter(({ index }) => index >= tocIndex)
    .map(({ line }) => line.replace(/^##\s+/u, "").trim());
  if (actual.some((heading) => !expected.includes(heading))) {
    return "README.md top-level headings must exactly match the general and applied-profile order; do not add unapproved headings.";
  }
  if (
    indices[required.indexOf("Links")] < indices[required.indexOf("License")] ||
    indices.some((index, position) => position > 0 && index <= indices[position - 1])
  ) {
    return "README.md must contain the required top-level headings in order with a Table of Contents.";
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    return "README.md top-level headings must exactly match the general and applied-profile order; do not add unapproved headings.";
  }

  const tocContent = lines.slice(tocIndex, indices[0]).join("\n");
  const actualLinks = [...tocContent.matchAll(/\[[^\]]*\]\(#([^)]+)\)/gu)].map((match) => match[1]);
  const expectedLinks = required.map((heading) => heading.toLowerCase().replaceAll(" ", "-"));
  if (JSON.stringify(actualLinks) !== JSON.stringify(expectedLinks)) {
    return "README.md Table of Contents must link every required heading exactly once, in document order.";
  }
  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

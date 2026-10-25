const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeHeader(lines, markdownLines, packageJson, order) {
  const headerIndexes = order.header.map((name) => order.headerLines[name]);
  const tocIndex = order.headerLines["table-of-contents"];
  const headerOrderIsValid = headerIndexes.every(
    (index, position) => position === 0 || index === headerIndexes[position - 1] + 2,
  );
  if (lines[0] !== brand) return "README.md must begin with the exact Eliware logo header.";
  const title = (lines[headerIndexes[1]] ?? "")
    .replace(/(?:\s+\[!\[[^\]]+\]\([^)]+\)\]\([^)]+\))+$/u, "")
    .replace(/^## /u, "");
  if (title !== packageJson?.name) return "README.md title must match package.json.name.";
  if (
    !headerOrderIsValid ||
    headerIndexes.slice(1).some((index) => lines[index - 1] !== "") ||
    lines[headerIndexes[2]] !== packageJson?.description ||
    markdownLines[tocIndex] !== `## ${order.tableOfContentsHeading}`
  )
    return "README.md must order its logo, title, description, and Table of Contents with blank lines.";
  return null;
}

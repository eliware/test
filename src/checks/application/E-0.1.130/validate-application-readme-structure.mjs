export function validateApplicationReadmeStructure(readme) {
  const headings = [...readme.matchAll(/^##\s+(.+?)\s*$/gimu)].map((heading) =>
    heading[1].trim().toLowerCase(),
  );
  const configurationIndex = headings.indexOf("configuration");
  const operationsIndex = headings.indexOf("operations");
  if (configurationIndex < 0 || operationsIndex < 0 || configurationIndex >= operationsIndex) {
    return "Application README.md must include Configuration and Operations headings in that order.";
  }
  if (
    !/\[[^\]]+\]\(#configuration\)/iu.test(readme) ||
    !/\[[^\]]+\]\(#operations\)/iu.test(readme)
  ) {
    return "Application README.md Table of Contents must link Configuration and Operations.";
  }
  return null;
}

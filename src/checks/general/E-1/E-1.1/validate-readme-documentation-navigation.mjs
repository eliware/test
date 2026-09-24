export function validateReadmeDocumentationNavigation(readme, { examplesRequired = true } = {}) {
  if (
    !readme.includes("Documentation:") ||
    !/\[docs\]\((?:\.\/)?docs\/README\.md\)/u.test(readme) ||
    !/\[specifications\]\((?:\.\/)?specs\/README\.md\)/u.test(readme) ||
    (examplesRequired && !/\[examples\]\((?:\.\/)?examples\/README\.md\)/u.test(readme))
  ) {
    return "README.md must include the standard Documentation navigation links.";
  }
  return null;
}

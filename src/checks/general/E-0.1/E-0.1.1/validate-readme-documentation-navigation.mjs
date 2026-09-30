export function validateReadmeDocumentationNavigation(readme, { docsRequired = false } = {}) {
  if (
    !readme.includes("Documentation:") ||
    (docsRequired && !/\[docs\]\((?:\.\/)?docs\/README\.md\)/u.test(readme)) ||
    !/\[specifications\]\((?:\.\/)?specs\/README\.md\)/u.test(readme)
  ) {
    return "README.md must include the standard Documentation navigation links.";
  }
  return null;
}

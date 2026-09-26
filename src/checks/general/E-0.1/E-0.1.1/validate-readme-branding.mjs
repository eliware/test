export function validateReadmeBranding(readme) {
  if (!readme.includes("eliware.org/logos/brand.png") || !readme.includes("github.com")) {
    return "README.md must use the standard Eliware branding and repository link.";
  }
  if (!readme.includes("actions/workflows/") || !readme.includes("badge.svg")) {
    return "README.md must include a GitHub CI badge.";
  }
  if (!readme.includes("[license]") && !readme.includes("(LICENSE)")) {
    return "README.md must include a license badge or LICENSE link.";
  }
  return null;
}

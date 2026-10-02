const allowedProfiles = new Set([
  "application",
  "cli",
  "discord",
  "mcp-server",
  "web",
  "library",
  "infrastructure",
  "workspace",
  "documentation",
  "npm-published",
  "ghcr-published",
  "private",
]);

export function validateExampleProfileHeadings(profileHeadings, label, errors) {
  if (!profileHeadings || typeof profileHeadings !== "object" || Array.isArray(profileHeadings)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  for (const [profile, headings] of Object.entries(profileHeadings)) {
    if (!allowedProfiles.has(profile)) {
      errors.push(`${label} contains unsupported profile ${profile}.`);
    } else if (!Array.isArray(headings)) {
      errors.push(`${label}.${profile} must be an array.`);
    } else {
      headings.forEach((heading, index) => {
        if (typeof heading !== "string" || heading.trim().length === 0)
          errors.push(`${label}.${profile}[${index}] must be a non-empty string.`);
      });
    }
  }
}

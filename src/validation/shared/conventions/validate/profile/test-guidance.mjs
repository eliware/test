const profileSections = {
  application: "Application",
  library: "Library",
};

const requiredGuidance = [
  "For a small change, run one or more focused tests.",
  "Run one test file with `npm test -- tests/path/to/example.test.mjs`.",
  "Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.",
  "Run the full `npm test` suite before a commit or milestone.",
];

export async function validateProfileTestGuidance(profile, inventory) {
  const section = profileSections[profile];
  if (!section) return [];

  let content;
  try {
    content = await inventory.readText("AGENTS.md");
  } catch (error) {
    return [`AGENTS.md could not be read: ${error.message}`];
  }

  const body = readSection(content, section);
  const missing = requiredGuidance.filter((guidance) => !body.includes(guidance));
  return missing.map((guidance) => `AGENTS.md ## ${section} must include: ${guidance}`);
}

function readSection(content, heading) {
  const lines = content.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `## ${heading}`);
  if (start < 0) return "";

  const end = lines.findIndex((line, index) => index > start && /^##\s+/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n");
}

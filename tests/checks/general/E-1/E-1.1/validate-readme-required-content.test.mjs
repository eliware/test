import { expect, test } from "@jest/globals";
import { normalizeRepositoryUrl, validateReadmeRequiredContent } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-required-content.mjs";

const standard = `# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)
## @eliware/fixture [![npm version](https://img.shields.io/npm/v/@eliware/fixture.svg)](https://www.npmjs.com/package/@eliware/fixture) [![license](https://img.shields.io/github/license/eliware/fixture.svg)](LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/nodejs.yml)
Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [examples](examples/README.md)
## Table of Contents
[Features](#features) · [Requirements](#requirements) · [Setup](#setup) · [Usage](#usage) · [Development](#development) · [Testing](#testing) · [Troubleshooting](#troubleshooting) · [Security](#security) · [Support](#support) · [License](#license) · [Links](#links)
## Features
## Requirements
## Setup
## Usage
## Development
## Testing
## Troubleshooting
## Security
## Support
[Discord](https://discord.gg/M6aTR9eTwN) eliware.org on Discord
## License
[LICENSE](LICENSE)
## Links
Eliware: [site](https://eliware.org) [GitHub](https://github.com/eliware) [repository](https://github.com/eliware/fixture) [npm](https://www.npmjs.com/package/@eliware/fixture)
## Purpose
## Configuration
## Validation
## Operations`;

test("accepts the standardized content surface", () => {
  expect(validateReadmeRequiredContent(standard, { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture", publishConfig: { access: "public" } })).toBeNull();
  expect(validateReadmeRequiredContent(standard, { name: "@eliware/fixture", publishConfig: { access: "public" } })).toBeNull();
});

test("allows the examples navigation link when the optional examples surface is absent", () => {
  const withoutExamples = standard.replace(" · [examples](examples/README.md)", "");
  expect(validateReadmeRequiredContent(withoutExamples, { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" }, { examplesRequired: false })).toBeNull();
  expect(validateReadmeRequiredContent(withoutExamples, { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" })).toContain("Documentation navigation");
});

test("requires the standard footer order", () => {
  const misplaced = standard.replace(
    /## License\n\[LICENSE\]\(LICENSE\)\n## Links/u,
    "## Links\nEliware: [site](https://eliware.org) [GitHub](https://github.com/eliware) [repository](https://github.com/eliware/fixture) [npm](https://www.npmjs.com/package/@eliware/fixture)\n## License\n[LICENSE](LICENSE)",
  );
  expect(validateReadmeRequiredContent(misplaced, { name: "@eliware/fixture" })).toContain("required top-level headings");
});

test.each([
  ["first line", standard.replace(/^#.*/u, "# custom") , "standard Eliware branding line"],
  ["package heading", standard.replace("## @eliware/fixture", "## fixture"), "standard package heading"],
  ["navigation", standard.replace("Documentation:", "Navigation:"), "standard Documentation navigation links"],
  ["support", standard.replace("eliware.org on Discord", "GitHub issues"), "standard Discord support block"],
  ["links", standard.replace("## Links", "## Navigation"), "standard Links section"],
  ["license", standard.replace("[LICENSE](LICENSE)", "MIT"), "repository LICENSE file"],
  ["public npm link", standard.replace("https://www.npmjs.com/package/@eliware/fixture", "https://example.com"), "npm version badge"],
])("rejects missing %s content", (_name, content, message) => {
  expect(validateReadmeRequiredContent(content, { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture", publishConfig: { access: "public" } })).toContain(message);
});

test("rejects every missing required heading and public package link", () => {
  for (const section of ["Features", "Requirements", "Setup", "Usage", "Development", "Testing", "Troubleshooting", "Security", "Support", "License", "Links"]) {
    expect(validateReadmeRequiredContent(standard.replace(`## ${section}`, `## ${section} removed`), { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" })).toContain(`${section} section`);
  }
  expect(validateReadmeRequiredContent(standard.replace("Documentation:", "Docs:"), { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" })).toContain("Documentation navigation");
  expect(validateReadmeRequiredContent(standard.replace(/ \[!\[license\][^\n]+/iu, ""), { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" })).toContain("license badge");
  expect(validateReadmeRequiredContent(standard.replace(/ \[!\[CI\][^\n]+/iu, ""), { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" })).toContain("GitHub CI badge");
});

test("requires the heading, npm badge, and repository links to match package metadata", () => {
  const metadata = { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture", publishConfig: { access: "public" } };
  expect(validateReadmeRequiredContent(standard.replace("## @eliware/fixture", "## @eliware/wrong-package"), metadata)).toContain("package heading");
  expect(validateReadmeRequiredContent(standard.replace("https://www.npmjs.com/package/@eliware/fixture", "https://www.npmjs.com/package/@eliware/wrong-package"), metadata)).toContain("npm version badge");
  expect(validateReadmeRequiredContent(standard.replace("[GitHub](https://github.com/eliware)", "[GitHub](https://github.com/other)"), metadata)).toContain("Links section");
});

test("requires the complete ordered footer and distinct organization, repository, and npm links", () => {
  const metadata = { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" };
  expect(validateReadmeRequiredContent(standard.replace("[LICENSE](LICENSE)", "License text"), metadata)).toContain("LICENSE");
  expect(validateReadmeRequiredContent(standard.replace("[GitHub](https://github.com/eliware)", "[GitHub](https://github.com/other)"), metadata)).toContain("Links section");
  expect(validateReadmeRequiredContent(standard.replace("[npm](https://www.npmjs.com/package/@eliware/fixture)", "[npm](https://example.com)"), metadata)).toContain("Links section");
  expect(validateReadmeRequiredContent(standard.replace("[Discord](https://discord.gg/M6aTR9eTwN) eliware.org on Discord", "[Support](https://discord.gg/M6aTR9eTwN)"), metadata)).toContain("Discord support");
});

test("rejects malformed repository metadata and handles a final Links section", () => {
  const metadata = { name: "@eliware/fixture", repository: "ssh://example.invalid/fixture" };
  const linksAtEnd = standard.replace(
    "## Links\nEliware: [site](https://eliware.org) [GitHub](https://github.com/eliware) [repository](https://github.com/eliware/fixture) [npm](https://www.npmjs.com/package/@eliware/fixture)\n## License\n[LICENSE](LICENSE)",
    "## License\n[LICENSE](LICENSE)\n## Links\nEliware: [site](https://eliware.org) [GitHub](https://github.com/eliware) [repository](https://github.com/eliware/fixture) [npm](https://www.npmjs.com/package/@eliware/fixture)",
  );
  expect(validateReadmeRequiredContent(linksAtEnd, metadata)).toContain("valid GitHub repository URL");
  expect(validateReadmeRequiredContent(standard, { name: "@eliware/fixture", repository: "https://github.com//fixture" })).toContain("valid GitHub repository URL");
  expect(validateReadmeRequiredContent(standard.replace("## Links", "## Navigation"), { name: "@eliware/fixture" })).toContain("Links section");
});

test("supports generic headings and repository metadata forms", () => {
  expect(validateReadmeRequiredContent(standard, { private: true })).toContain("Non-public");
  expect(validateReadmeRequiredContent(standard, { repository: { url: "https://github.com/eliware/fixture" } })).toBeNull();
  expect(validateReadmeRequiredContent(standard, { repository: { url: 7 } })).toContain("valid GitHub repository URL");
  expect(validateReadmeRequiredContent(standard)).toBeNull();
  expect(normalizeRepositoryUrl()).toBe("https://github.com/eliware/fixture");
  expect(normalizeRepositoryUrl("")).toBeNull();
});

test("enforces the clarified README structure and TOC", () => {
  expect(validateReadmeRequiredContent(standard.replace("## Table of Contents", "## Purpose"))).toContain("required top-level headings");
  expect(validateReadmeRequiredContent(standard.replace("[Testing](#testing)", ""))).toContain("Table of Contents");
  expect(validateReadmeRequiredContent(standard.replace("## Features", "## Purpose\n## Features"))).toContain("contiguously");
  expect(validateReadmeRequiredContent(standard.replace("## License", "## Links\n## License"))).toContain("required top-level headings");
  expect(validateReadmeRequiredContent(standard.replace("## Requirements", "## Setup\n## Requirements"))).toContain("required top-level headings");
  expect(validateReadmeRequiredContent(standard.replace("## Purpose", "## Removed"))).toContain("Purpose section");
  expect(validateReadmeRequiredContent(standard.slice(0, standard.indexOf("\n## Purpose")), { name: "@eliware/fixture" })).toContain("Purpose section");
  const linksAtEnd = standard.replace(/\n## Purpose[\s\S]*?\n## Support/u, "\n## Purpose\n## Configuration\n## Validation\n## Operations\n## Support");
  expect(validateReadmeRequiredContent(linksAtEnd, { name: "@eliware/fixture" })).toBeNull();
});

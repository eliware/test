import { expect, test } from "@jest/globals";
import { validateReadmeStructure } from "../../../../src/checks/general/E-0.1.0.1.3/validate-readme-structure.mjs";
import { resolveReadmeHeadings } from "../../../../src/checks/general/E-0.1.0.1.3/resolve-readme-headings.mjs";

const expected = ["Table of Contents", "Features", "Support", "License", "Links"];
const packageJson = { name: "fixture", description: "Description" };
const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const valid = `${brand}\n\nfixture\n\nDescription\n\n## Table of Contents\n\n- [Features](#features)\n- [Support](#support)\n- [License](#license)\n- [Links](#links)\n\n## Features\n\n## Support\n\n## License\n\n## Links`;

test("accepts canonical section and link order", () => {
  expect(validateReadmeStructure(valid, expected, packageJson)).toBeNull();
});

test("enforces Documentation headings and their Table of Contents links", () => {
  const documentationPackage = {
    ...packageJson,
    eliware: { apply: ["general", "documentation", "private"] },
  };
  const headings = resolveReadmeHeadings(documentationPackage);
  const content = [
    brand,
    "",
    documentationPackage.name,
    "",
    documentationPackage.description,
    "",
    `## ${headings[0]}`,
    "",
    ...headings
      .slice(1)
      .map((heading) => `- [${heading}](#${heading.toLowerCase().replaceAll(" ", "-")})`),
    "",
    ...headings.slice(1).map((heading) => `## ${heading}`),
  ].join("\n");

  expect(validateReadmeStructure(content, headings, documentationPackage)).toBeNull();
  expect(
    validateReadmeStructure(
      content.replace("## Scope", "## Scope omitted"),
      headings,
      documentationPackage,
    ),
  ).toContain("headings");
  expect(
    validateReadmeStructure(
      content.replace("- [Scope](#scope)\n", ""),
      headings,
      documentationPackage,
    ),
  ).toContain("Table of Contents");
});

test("accepts a title with trailing badges", () => {
  const content = valid.replace(
    "fixture\n\nDescription",
    "fixture [![build](https://example.com/build.svg)](https://example.com/build)\n\nDescription",
  );
  expect(validateReadmeStructure(content, expected, packageJson)).toBeNull();
});

test("rejects invalid brand, title, headings, and contents list", () => {
  expect(validateReadmeStructure("bad", expected, packageJson)).toContain("logo header");
  expect(
    validateReadmeStructure(
      `${brand}\n\nwrong\n\nDescription\n\n## Table of Contents`,
      expected,
      packageJson,
    ),
  ).toContain("title");
  expect(
    validateReadmeStructure(valid.replace("## Features", "## Other"), expected, packageJson),
  ).toContain("headings");
  expect(
    validateReadmeStructure(valid.replace("#features", "#wrong"), expected, packageJson),
  ).toContain("Table of Contents");
  expect(validateReadmeStructure(`${brand}\n\nfixture`, expected, packageJson)).toContain(
    "Table of Contents",
  );
  expect(
    validateReadmeStructure(
      `${brand}\n\nfixture\n\nextra\n\n## Table of Contents`,
      expected,
      packageJson,
    ),
  ).toContain("title");
  expect(validateReadmeStructure(valid, expected, { description: "Description" })).toContain(
    "title",
  );
});

test("does not count table-of-contents links inside code", () => {
  const codeLinks = expected
    .slice(1)
    .map((heading) => `- [${heading}](#${heading.toLowerCase().replaceAll(" ", "-")})`)
    .join("\n");
  const content = valid
    .replace(/- \[[^\]]+\]\(#[^)]+\)(?:\n)?/gu, "")
    .replace(
      "## Table of Contents\n\n",
      `## Table of Contents\n\n\`\`\`md\n${codeLinks}\n\`\`\`\n\n`,
    );
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("Table of Contents");
});

test("does not count table-of-contents images as links", () => {
  const content = valid.replace("- [Features](#features)", "- ![Features](#features)");
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("Table of Contents");
});

test("does not count the required title inside code", () => {
  const content = valid.replace("\n\nfixture\n\n", "\n\n```text\nfixture\n```\n\n");
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("title");
  expect(validateReadmeStructure(brand, expected, packageJson)).toContain("title");
});

test("does not count section headings inside code", () => {
  const sections = expected
    .slice(1)
    .map((heading) => `## ${heading}`)
    .join("\n");
  const content = valid
    .replace(/## (Features|Support|License|Links)/gu, "")
    .replace("## Table of Contents", `## Table of Contents\n\n\`\`\`md\n${sections}\n\`\`\``);
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("headings");
});

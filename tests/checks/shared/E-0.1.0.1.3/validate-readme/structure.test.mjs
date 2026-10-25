import { expect, test } from "@jest/globals";
import { validateReadmeStructure } from "../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/structure.mjs";
import { readCanonicalOrder } from "../../../../../src/validation/shared/conventions/read-canonical-order.mjs";

const order = readCanonicalOrder("readme-sections.yaml");
const expected = [order.tableOfContentsHeading, ...order.generalSections, ...order.finalSections];
const packageJson = { name: "fixture", description: "Description" };
const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const valid = createReadme(expected, packageJson);

function createReadme(headings, metadata) {
  return [
    brand,
    "",
    `## ${metadata.name}`,
    "",
    metadata.description,
    "",
    `## ${headings[0]}`,
    "",
    ...headings
      .slice(1)
      .map((heading) => `- [${heading}](#${heading.toLowerCase().replaceAll(" ", "-")})`),
    "",
    ...headings.slice(1).flatMap((heading) => [`## ${heading}`, "Section text.", ""]),
  ].join("\n");
}

test("accepts canonical section and link order", () => {
  expect(validateReadmeStructure(valid, expected, packageJson)).toBeNull();
});

test("rejects blank required sections", () => {
  const blank = valid.replace("## Features\nSection text.", "## Features\n\n### Details");
  expect(validateReadmeStructure(blank, expected, packageJson)).toContain(
    "README.md section Features must contain content.",
  );
});

test("accepts a title with trailing badges", () => {
  const content = valid.replace(
    "## fixture\n\nDescription",
    "## fixture [![build](https://example.com/build.svg)](https://example.com/build)\n\nDescription",
  );
  expect(validateReadmeStructure(content, expected, packageJson)).toBeNull();
});

test("rejects invalid brand, title, headings, and contents list", () => {
  expect(validateReadmeStructure("bad", expected, packageJson)).toContain("logo header");
  expect(
    validateReadmeStructure(
      `${brand}\n\n## wrong\n\nDescription\n\n## Table of Contents`,
      expected,
      packageJson,
    ),
  ).toContain("title");
  expect(
    validateReadmeStructure(valid.replace("## Features", "## Other"), expected, packageJson),
  ).toContain("required section");
  expect(
    validateReadmeStructure(valid.replace("#features", "#wrong"), expected, packageJson),
  ).toContain("Table of Contents");
  expect(validateReadmeStructure(`${brand}\n\n## fixture`, expected, packageJson)).toContain(
    "Table of Contents",
  );
  expect(
    validateReadmeStructure(
      `${brand}\n\n## fixture\n\nextra\n\n## Table of Contents`,
      expected,
      packageJson,
    ),
  ).toContain("title");
  expect(validateReadmeStructure(valid, expected, { description: "Description" })).toContain(
    "title",
  );
});

test("rejects unlisted sections", () => {
  const unlisted = valid.replace("## License", "## News\n\nSection text.\n\n## License");
  expect(validateReadmeStructure(unlisted, expected, packageJson)).toContain("unlisted sections");
});

test("rejects invalid blank lines in the header", () => {
  expect(
    validateReadmeStructure(
      valid.replace("Description\n\n##", "Description\n##"),
      expected,
      packageJson,
    ),
  ).toContain("Table of Contents with blank lines");
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
  const content = valid.replace("\n\n## fixture\n\n", "\n\n```text\n## fixture\n```\n\n");
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("title");
  expect(validateReadmeStructure(brand, expected, packageJson)).toContain("title");
  expect(validateReadmeStructure(valid, expected)).toContain("title");
});

test("does not count section headings inside code", () => {
  const sections = expected
    .slice(1)
    .map((heading) => `## ${heading}`)
    .join("\n");
  const content = valid
    .replace(/## (Features|Support|License|Links)/gu, "")
    .replace("## Table of Contents", `## Table of Contents\n\n\`\`\`md\n${sections}\n\`\`\``);
  expect(validateReadmeStructure(content, expected, packageJson)).toContain("required section");
});

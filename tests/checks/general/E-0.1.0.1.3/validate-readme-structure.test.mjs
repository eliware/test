import { expect, test } from "@jest/globals";
import { validateReadmeStructure } from "../../../../src/checks/general/E-0.1.0.1.3/validate-readme-structure.mjs";

const expected = ["Table of Contents", "Features", "Support", "License", "Links"];
const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const valid = `${brand}\n\nfixture\n\n## Table of Contents\n\n- [Features](#features)\n- [Support](#support)\n- [License](#license)\n- [Links](#links)\n\n## Features\n\n## Support\n\n## License\n\n## Links`;

test("accepts canonical section and link order", () => {
  expect(validateReadmeStructure(valid, expected, { name: "fixture" })).toBeNull();
});

test("rejects invalid brand, title, headings, and contents list", () => {
  expect(validateReadmeStructure("bad", expected, { name: "fixture" })).toContain("logo header");
  expect(
    validateReadmeStructure(`${brand}\n\nwrong\n\n## Table of Contents`, expected, {
      name: "fixture",
    }),
  ).toContain("title");
  expect(
    validateReadmeStructure(valid.replace("## Features", "## Other"), expected, {
      name: "fixture",
    }),
  ).toContain("headings");
  expect(
    validateReadmeStructure(valid.replace("#features", "#wrong"), expected, { name: "fixture" }),
  ).toContain("Table of Contents");
  expect(validateReadmeStructure(`${brand}\n\nfixture`, expected, { name: "fixture" })).toContain(
    "Table of Contents",
  );
  expect(
    validateReadmeStructure(`${brand}\n\nfixture\n\nextra\n\n## Table of Contents`, expected, {
      name: "fixture",
    }),
  ).toContain("title");
  expect(validateReadmeStructure(valid, expected)).toContain("title");
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
  expect(validateReadmeStructure(content, expected, { name: "fixture" })).toContain(
    "Table of Contents",
  );
});

test("does not count table-of-contents images as links", () => {
  const content = valid.replace("- [Features](#features)", "- ![Features](#features)");
  expect(validateReadmeStructure(content, expected, { name: "fixture" })).toContain(
    "Table of Contents",
  );
});

test("does not count the required title inside code", () => {
  const content = valid.replace("\n\nfixture\n\n", "\n\n```text\nfixture\n```\n\n");
  expect(validateReadmeStructure(content, expected, { name: "fixture" })).toContain("title");
});

test("does not count section headings inside code", () => {
  const sections = expected
    .slice(1)
    .map((heading) => `## ${heading}`)
    .join("\n");
  const content = valid
    .replace(/## (Features|Support|License|Links)/gu, "")
    .replace("## Table of Contents", `## Table of Contents\n\n\`\`\`md\n${sections}\n\`\`\``);
  expect(validateReadmeStructure(content, expected, { name: "fixture" })).toContain("headings");
});

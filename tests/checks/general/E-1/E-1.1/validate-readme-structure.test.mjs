import { expect, test } from "@jest/globals";
import { expectedReadmeHeadings } from "../../../../../src/checks/general/E-1/E-1.1/read-readme-sections.mjs";
import { validateReadmeStructure } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-structure.mjs";

const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

function fixture() {
  const expected = expectedReadmeHeadings();
  const sections = expected.slice(1);
  const toc = sections.map(
    (section) => `[${section}](#${section.toLowerCase().replaceAll(" ", "-")})`,
  );
  return `${brand}\n\n## @eliware/fixture\n\n## Table of Contents\n${toc.join(" · ")}\n${sections.map((section) => `## ${section}\ncontent`).join("\n")}`;
}

test("accepts canonical headings and a complete ordered table of contents", () => {
  expect(validateReadmeStructure(fixture())).toBeNull();
});

test("requires the standard brand line, table of contents, and title placement", () => {
  expect(validateReadmeStructure(fixture().replace(brand, "# custom"))).toContain("branding line");
  expect(
    validateReadmeStructure(fixture().replace("## Table of Contents", "## Purpose")),
  ).toContain("Table of Contents");
  expect(
    validateReadmeStructure(
      fixture().replace("## Table of Contents", "Intro text\n## Table of Contents"),
    ),
  ).toContain("without intervening content");
});

test("rejects missing, additional, or reordered sections", () => {
  const readme = fixture();
  expect(validateReadmeStructure(readme.replace("## Features", "## Features removed"))).toContain(
    "Features section",
  );
  expect(validateReadmeStructure(readme.replace("## Links", "## Links removed"))).toContain(
    "Links section",
  );
  expect(
    validateReadmeStructure(readme.replace("## Features", "## Purpose\n## Features")),
  ).toContain("exactly match");
  expect(
    validateReadmeStructure(
      readme.replace(
        "## Features\ncontent\n## Requirements",
        "## Requirements\ncontent\n## Features",
      ),
    ),
  ).toContain("in order");
  expect(
    validateReadmeStructure(readme.replace("## Links\ncontent", "## Links\ncontent\n## Links")),
  ).toContain("exactly match");
});

test("requires each table-of-contents link exactly once in document order", () => {
  const readme = fixture();
  expect(validateReadmeStructure(readme.replace("[Testing](#testing)", ""))).toContain(
    "Table of Contents",
  );
  expect(
    validateReadmeStructure(
      readme.replace("[Testing](#testing)", "[Testing](#testing) · [Testing](#testing)"),
    ),
  ).toContain("exactly once");
  expect(
    validateReadmeStructure(
      readme.replace(
        "[Features](#features) · [Requirements](#requirements)",
        "[Requirements](#requirements) · [Features](#features)",
      ),
    ),
  ).toContain("document order");
});

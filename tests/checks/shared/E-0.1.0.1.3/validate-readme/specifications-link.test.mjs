import { expect, test } from "@jest/globals";
import { resolveReadmeHeadings } from "../../../../../src/checks/shared/E-0.1.0.1.3/resolve-readme-headings.mjs";
import { validateReadmeSpecificationsLink } from "../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/specifications-link.mjs";

const expected = resolveReadmeHeadings({ eliware: { apply: ["general"] } });
const valid = `# Brand\n## ${expected[0]}\n- [Features](#features)\n${expected
  .slice(1)
  .map(
    (heading) => `## ${heading}\n${heading === "Features" ? "[Specs](specs/README.md)" : "Text"}`,
  )
  .join("\n")}`;

test("accepts a resolving specs index link in a content section", () => {
  expect(validateReadmeSpecificationsLink(valid, expected)).toBeNull();
});

test("requires the specs index link", () => {
  expect(
    validateReadmeSpecificationsLink(valid.replace("[Specs](specs/README.md)", "Text"), expected),
  ).toContain("from a content section");
});

test.each(["header", "Table of Contents", "Support", "Links", "License"])(
  "rejects the specs index link in %s",
  (location) => {
    let readme = valid;
    if (location === "header") readme = readme.replace("# Brand", "# [Specs](specs/README.md)");
    else if (location === "Table of Contents")
      readme = readme.replace(
        "- [Features](#features)",
        "- [Specs](specs/README.md)\n- [Features](#features)",
      );
    else
      readme = readme.replace(`## ${location}\nText`, `## ${location}\n[Specs](specs/README.md)`);
    expect(validateReadmeSpecificationsLink(readme, expected)).toContain("must not link");
  },
);

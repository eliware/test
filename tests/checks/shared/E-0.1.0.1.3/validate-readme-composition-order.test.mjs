import { expect, test } from "@jest/globals";
import { resolveReadmeHeadings } from "../../../../src/checks/shared/E-0.1.0.1.3/resolve-readme-headings.mjs";
import { validateReadmeCompositionOrder } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-composition-order.mjs";

const packageJson = {
  name: "@eliware/example",
  description: "Example package",
  eliware: { apply: ["general", "application"] },
};
const expected = resolveReadmeHeadings(packageJson);
const valid = createReadme(expected);

function createReadme(headings) {
  return [
    "## @eliware/example",
    `## ${headings[0]}`,
    ...headings.slice(1).map((heading) => `## ${heading}`),
  ].join("\n");
}

test("requires all selected sections in canonical order", () => {
  const reordered = valid.replace(
    "## Configuration\n## Operations",
    "## Operations\n## Configuration",
  );
  expect(validateReadmeCompositionOrder(reordered, expected)).toContain("complete order");
  expect(
    validateReadmeCompositionOrder(valid.replace("## Configuration\n", ""), expected),
  ).toContain("complete order");
});

test("requires Support, Links, and License after the profile sections", () => {
  const misplaced = valid
    .replace("## Support", "## License\n## Support")
    .replace("## License\n## Links", "## Links");
  expect(validateReadmeCompositionOrder(misplaced, expected)).toContain("complete order");
});

test("accepts the complete selected section order", () => {
  expect(validateReadmeCompositionOrder(valid, expected)).toBeNull();
});

test("rejects sections from unselected profiles", () => {
  const generalOnly = resolveReadmeHeadings({ eliware: { apply: ["general"] } });
  const content = createReadme(generalOnly).replace("## Features", "## Exit codes\n## Features");
  expect(validateReadmeCompositionOrder(content, generalOnly)).toContain("complete order");
});

test("does not accept a subset of required sections", () => {
  expect(validateReadmeCompositionOrder(createReadme(expected.slice(0, 2)), expected)).toContain(
    "complete order",
  );
});

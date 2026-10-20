import { removeMarkdownCode } from "../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import { readCanonicalOrder } from "../../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateAgentsStructure(content, specificationHeadings = new Set()) {
  const firstContentLine = content.split(/\r?\n/u).find((line) => line.trim() !== "");
  if (firstContentLine !== "# AGENTS.md") return ["AGENTS.md must begin with # AGENTS.md."];
  const markdown = removeMarkdownCode(content);
  const lines = markdown.split(/\r?\n/u);
  const sections = lines.flatMap((line, index) =>
    /^##\s+/u.test(line) ? [{ index, heading: line.slice(3).trim() }] : [],
  );
  const actual = sections.map(({ heading }) => heading);
  const order = readCanonicalOrder("agents-sections.yaml");
  const baseSections = order.baseSections;
  if (baseSections.some((section, index) => actual[index] !== section))
    return ["AGENTS.md must begin with the seven required headings in order."];
  const remaining = actual.slice(baseSections.length);
  if (
    new Set(actual).size !== actual.length ||
    remaining.some((h) => !isKnownHeading(h, order, specificationHeadings))
  )
    return ["AGENTS.md has duplicate, undeclared, or misordered section headings."];
  const emptySections = sections.filter(({ index }) => {
    const nextSection = sections.find((section) => section.index > index);
    return !lines
      .slice(index + 1, nextSection?.index)
      .some((line) => line.trim() && !/^#{1,6}\s/u.test(line.trim()));
  });
  if (emptySections.length)
    return emptySections.map(({ heading }) => `AGENTS.md section ${heading} must contain content.`);
  return [];
}

function isKnownHeading(heading, order, specificationHeadings) {
  return (
    Object.values(order.profileHeadings).includes(heading) || specificationHeadings.has(heading)
  );
}

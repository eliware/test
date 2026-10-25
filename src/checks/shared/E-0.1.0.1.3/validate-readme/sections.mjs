export function validateReadmeSections(markdownLines, expectedSections, titleIndex, tocIndex) {
  const headings = markdownLines.flatMap((line, index) =>
    index !== titleIndex && /^##\s+/u.test(line) ? [{ index, heading: line.slice(3).trim() }] : [],
  );
  const actualSections = headings
    .filter(({ index }) => index !== tocIndex)
    .map(({ heading }) => heading);
  if (
    new Set(actualSections).size !== actualSections.length ||
    actualSections.length !== expectedSections.length ||
    actualSections.some((heading) => !expectedSections.includes(heading))
  )
    return {
      error: "README.md must include every required section once and no unlisted sections.",
    };
  const contentSections = headings.filter(({ index }) => index !== tocIndex);
  const emptySections = contentSections.filter(({ index }) => {
    const nextSection = headings.find((section) => section.index > index);
    return !markdownLines
      .slice(index + 1, nextSection?.index)
      .some((line) => line.trim() && !/^#{1,6}\s/u.test(line.trim()));
  });
  if (emptySections.length)
    return {
      error: emptySections
        .map(({ heading }) => `README.md section ${heading} must contain content.`)
        .join("\n"),
      headings,
    };
  return { headings, error: null };
}

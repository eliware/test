import readTocLinks from "../toc-links.mjs";
function validateReadmeTocLinks(markdownLines, tocIndex, expectedSections) {
  const tocEnd = markdownLines.findIndex((line, index) => index > tocIndex && /^##\s+/u.test(line));
  const tocContent = markdownLines.slice(tocIndex, tocEnd).join("\n");
  const expectedLinks = expectedSections.map((heading) => [
    heading,
    heading.toLowerCase().replaceAll(" ", "-"),
  ]);
  const actualLinks = readTocLinks(tocContent);
  return JSON.stringify(actualLinks) === JSON.stringify(expectedLinks)
    ? null
    : "README.md Table of Contents must link each content heading once in order.";
}
export default validateReadmeTocLinks;

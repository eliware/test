export function readApplicationReadmeSections(readme) {
  const headings = [...readme.matchAll(/^##\s+(.+?)\s*$/gimu)];
  return Object.fromEntries(
    headings.map((heading, index) => {
      const name = heading[1].trim().toLowerCase();
      const contentStart = heading.index + heading[0].length;
      const nextHeading = headings[index + 1];
      return [name, readme.slice(contentStart, nextHeading?.index ?? readme.length).trim()];
    }),
  );
}

export function readReadmeSections(readme, headings) {
  const lines = readme.split(/\r?\n/u);
  return new Map(
    headings.map((section) => {
      const headingIndex = lines.findIndex((line) => {
        const match = /^#{1,6}\s+(.+?)\s*$/u.exec(line);
        return match?.[1].toLowerCase() === section.toLowerCase();
      });
      if (headingIndex < 0) return [section, ""];
      const end = lines.findIndex(
        (line, index) => index > headingIndex && /^#{1,6}\s+\S/u.test(line),
      );
      return [
        section,
        lines
          .slice(headingIndex + 1, end < 0 ? lines.length : end)
          .join("\n")
          .trim()
          .toLowerCase(),
      ];
    }),
  );
}

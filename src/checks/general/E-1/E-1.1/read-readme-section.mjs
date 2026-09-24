export function readSection(readme, heading) {
  const lines = readme.split(/\r?\n/u);
  const start = lines.findIndex((line) =>
    new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "iu").test(line),
  );
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^#{1,6}\s+\S/u.test(line));
  return lines
    .slice(start + 1, end < 0 ? lines.length : end)
    .join("\n")
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

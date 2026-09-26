export function validateExamplesIndex(index, exampleNames = []) {
  const lower = index.toLowerCase();
  for (const requirement of ["purpose", "prerequisites", "command", "expected result"]) {
    if (!lower.includes(requirement)) return `examples/README.md must document ${requirement}.`;
  }
  for (const name of exampleNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\[${escaped}\\]\\([^)]*\\)`, "iu").test(index))
      return `examples/README.md must index ${name}.`;
  }
  return null;
}

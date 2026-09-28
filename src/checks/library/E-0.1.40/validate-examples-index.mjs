export function validateExamplesIndex(index, exampleNames = []) {
  const lower = index.toLowerCase();
  const failures = [];
  for (const requirement of ["purpose", "prerequisites", "command", "expected result"]) {
    if (!lower.includes(requirement))
      failures.push(`examples/README.md must document ${requirement}.`);
  }
  for (const name of exampleNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\[${escaped}\\]\\([^)]*\\)`, "iu").test(index))
      failures.push(`examples/README.md must index ${name}.`);
  }
  return failures.length ? failures.join("\n") : null;
}

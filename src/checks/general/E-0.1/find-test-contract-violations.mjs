export function findTestContractViolations(sourceFiles, testContents) {
  const findings = [];
  for (const source of sourceFiles) {
    const test = source.replace(/\.mjs$/u, ".test.mjs");
    const content = testContents.get(test) ?? "";
    if (!/\b(?:test|it|describe)\s*\(/u.test(content)) findings.push(`${test} is not a Jest test file`);
    if (!/(?:from|import|require\s*\()[\s\S]*src[\\/]\S+\.mjs/u.test(content)) findings.push(`${test} does not reference an implementation module`);
  }
  return findings;
}

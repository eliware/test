function finding(message) { return { group: 'examples', message }; }
export function checkExamples(examplePaths, readmeByPath = new Map(), packageFiles = new Map()) {
  const findings = [];
  if (!examplePaths.length) return [finding('examples/: must contain at least one example')];
  for (const example of examplePaths) {
    const readme = readmeByPath.get(example) ?? '';
    const packageJson = packageFiles.get(example);
    if (!readme && !packageJson?.scripts && !packageJson?.commands) findings.push(finding(`examples/${example}: missing setup/run instructions`));
    if (packageJson?.__error) findings.push(finding(`examples/${example}/package.json: ${packageJson.__error}`));
  }
  return findings;
}

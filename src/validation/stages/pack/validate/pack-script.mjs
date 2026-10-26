export function validatePackScript(packageJson, { selfHosted = false } = {}) {
  const expected = selfHosted ? "node bin/eliware-test.mjs --pack" : "eliware-test --pack";
  return packageJson?.scripts?.pack === expected
    ? null
    : "Public npm packages must define pack=eliware-test --pack.";
}

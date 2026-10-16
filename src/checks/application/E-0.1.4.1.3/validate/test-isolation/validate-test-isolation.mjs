import { findTestIsolationViolations } from "./find/test-isolation-violations.mjs";

export async function validateTestIsolation(context = {}) {
  if (context.packageJson?.name === "@eliware/test") return [];
  const inventory = context.repositoryInventory;
  if (!inventory?.files || !inventory?.readText)
    return ["Test isolation could not inspect the test files."];
  try {
    const paths = (await inventory.files("all")).filter(
      (path) => path.startsWith("tests/") && path.endsWith(".test.mjs"),
    );
    const findings = [];
    for (const path of paths) {
      let source;
      try {
        source = await inventory.readText(path);
      } catch {
        findings.push(`${path} could not be read for test isolation checks.`);
        continue;
      }
      findings.push(...findTestIsolationViolations(source).map((message) => `${path}: ${message}`));
    }
    return findings;
  } catch {
    return ["Test isolation could not inspect the test files."];
  }
}

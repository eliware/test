import { basename, join } from "node:path";

const forbiddenJestImports = /(?:from\s*|import\s*\()(["'])(?:jest|@jest\/core|jest-cli)\1/gu;
const forbiddenCoverage = /istanbul\s+ignore|coverage\s*:\s*false/iu;

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const errors = [];
  let files = [];
  try {
    files = await inventory.files("source");
  } catch {
    return ["Jest source policy could not read the repository inventory."];
  }
  for (const path of files) {
    if (!path.startsWith("src/") || !/\.(?:mjs|js|cjs|ts|tsx|cts)$/iu.test(path)) continue;
    let content;
    try {
      content = await inventory.readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read to check Jest source policy.`);
      continue;
    }
    if (forbiddenJestImports.test(content))
      errors.push(`${path} must not import or invoke the Jest runner.`);
    forbiddenJestImports.lastIndex = 0;
    if (path.startsWith("src/") && forbiddenCoverage.test(content))
      errors.push(`${path} must not exclude production coverage.`);
  }
  const configFiles = (await inventory.files("all")).filter((path) =>
    /^jest\.config\.(?:js|cjs|mjs|json|ts|cts)$/iu.test(basename(path)),
  );
  for (const path of configFiles) errors.push(`${path} is a separate Jest configuration file.`);
  return errors;
}

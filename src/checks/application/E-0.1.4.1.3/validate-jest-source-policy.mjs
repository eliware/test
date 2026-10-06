import { basename, join } from "node:path";

const forbiddenToolReference =
  /["'](?:@jest\/(?!globals(?:["'/]))[^"']+|jest(?:-[^/"']+)?(?:\/[^"']*)?|vitest(?:\/[^"']*)?|mocha(?:\/[^"']*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@vitest\/coverage-[^"']+)["']/giu;
const forbiddenToolCommand =
  /(?:^|[\s/\\])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress)(?:\.cmd)?(?:[\\/"']|\s|$)|\bnode\s+--test(?:\s|$)|\b(?:bun|deno)\s+test(?:\s|$)/iu;
const forbiddenCoverage = /\b(?:istanbul|c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  if (context.packageJson?.name === "@eliware/test") return [];
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
    if (forbiddenToolReference.test(content) || hasRunnerCommand(content))
      errors.push(`${path} must not import or invoke a test runner or coverage tool.`);
    forbiddenToolReference.lastIndex = 0;
    if (forbiddenCoverage.test(content))
      errors.push(`${path} must not exclude production coverage.`);
  }
  const configFiles = (await inventory.files("all")).filter((path) =>
    /^jest\.config\.(?:js|cjs|mjs|json|ts|cts)$/iu.test(basename(path)),
  );
  for (const path of configFiles) errors.push(`${path} is a separate Jest configuration file.`);
  return errors;
}

function hasRunnerCommand(content) {
  return content.split(/\r?\n/u).some((line) => forbiddenToolCommand.test(line));
}

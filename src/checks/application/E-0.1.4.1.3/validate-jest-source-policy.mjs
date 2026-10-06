import { basename, join } from "node:path";

const forbiddenToolReference =
  /["'`](@jest\/(?!globals(?:["'/]))[^"'`]+|@vitest\/[^"'`]+|@tapjs\/[^"'`]+|@wdio\/[^"'`]+|@cypress\/[^"'`]+|jest(?:-[^/"'`]+)?(?:\/[^/"'`]*)?|vitest(?:\/[^"'`]*)?|mocha(?:\/[^"'`]*)?|ava|tap|tape|uvu|c8|nyc|istanbul|babel-plugin-istanbul|node:test|playwright|@playwright\/test|cypress|jasmine|@bcoe\/v8-coverage)["'`]/giu;
const forbiddenToolCommand =
  /(?:^|[\s/\\"'`])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\\/"'`]|\s|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|[\s"'`])|\b(?:bun|deno)\s+test(?:\s|$)/iu;
const forbiddenCoverage = /\b(?:istanbul|c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  if (context.packageJson?.name === "@eliware/test") return [];
  const errors = [];
  let files = [];
  try {
    files = await inventory.files("all");
  } catch {
    return ["Jest source policy could not read the repository inventory."];
  }
  for (const path of files) {
    if (!isPolicyFile(path)) continue;
    let content;
    try {
      content = await inventory.readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read to check Jest source policy.`);
      continue;
    }
    if (forbiddenToolReference.test(content) || forbiddenToolCommand.test(content))
      errors.push(`${path} must not import or invoke a test runner or coverage tool.`);
    forbiddenToolReference.lastIndex = 0;
    forbiddenToolCommand.lastIndex = 0;
    if (path.startsWith("src/") && forbiddenCoverage.test(content))
      errors.push(`${path} must not exclude production coverage.`);
  }
  const configFiles = files.filter((path) =>
    /^(?:jest\.config|\.jestrc|vitest\.(?:config|workspace)|\.mocharc|mocha\.config|ava\.config|\.nycrc|nyc\.config|c8\.config|playwright\.config|cypress\.config|karma\.conf|jasmine\.config|babel\.config|\.babelrc|\.taprc|tap\.config|tape\.config|uvu\.config|qunit\.config|webdriverio\.config|istanbul\.config)(?:\.[^.]+)?$/iu.test(
      basename(path),
    ),
  );
  for (const path of configFiles)
    errors.push(`${path} is a separate test runner or coverage configuration file.`);
  return errors;
}

function isPolicyFile(path) {
  if (path === "package.json") return true;
  const codeFile = /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path);
  const configurationFile = /(?:config|rc|opts)(?:\.[^.]+)?$/iu.test(basename(path));
  return (/^(?:src|tests|bin|scripts|examples)\//u.test(path) && codeFile) || configurationFile;
}

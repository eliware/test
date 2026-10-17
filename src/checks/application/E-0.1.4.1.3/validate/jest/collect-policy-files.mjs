import { join } from "node:path";

export async function collectJestPolicyFiles(inventory, root) {
  let paths;
  try {
    paths = await inventory.files("all");
  } catch {
    return { errors: ["Jest source policy could not read the repository inventory."], files: [] };
  }
  const files = [];
  const errors = [];
  for (const path of paths) {
    if (!isPolicyFile(path)) continue;
    try {
      files.push({ path, content: await inventory.readText(join(root, path)) });
    } catch {
      errors.push(`${path} could not be read to check Jest source policy.`);
    }
  }
  return { errors, files, paths };
}

function isPolicyFile(path) {
  if (path === "package.json") return true;
  const codeFile = /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx|sh|ps1|py)$/iu.test(path);
  const configurationFile = /(?:config|rc|opts)(?:\.[^.]+)?$/iu.test(path.split("/").at(-1));
  return (/^(?:src|tests|bin|scripts|examples)\//u.test(path) && codeFile) || configurationFile;
}

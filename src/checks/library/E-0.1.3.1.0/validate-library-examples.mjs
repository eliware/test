import { join } from "node:path";

export async function validateLibraryExamples(context = {}) {
  try {
    const files = await context.repositoryInventory.documentationFiles({
      directory: join(context.root ?? process.cwd(), "examples"),
      predicate: (name) => /\.m?js$/iu.test(name),
      includeGenerated: true,
    });
    return files.length ? [] : ["Libraries must provide at least one native-ESM example."];
  } catch {
    return ["Libraries must provide an examples/ directory with a native-ESM example."];
  }
}

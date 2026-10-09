export function createMcpToolFixture(options = {}) {
  const adapters = options.adapters ?? ["echo"];
  const handlers = options.handlers ?? ["echo"];
  const files = [];
  const contents = new Map();
  for (const name of adapters) {
    files.push(`tools/${name}.mjs`);
    contents.set(`tools/${name}.mjs`, `export { default } from "../src/tools/${name}.mjs";`);
  }
  for (const name of handlers) {
    files.push(`src/tools/${name}.mjs`);
    contents.set(`src/tools/${name}.mjs`, "export default async function registerTool() {};");
  }
  return {
    files: async () => files,
    readText: async (path) => {
      if (!contents.has(path)) throw new Error(`missing fixture: ${path}`);
      return contents.get(path);
    },
    contents,
    fileList: files,
  };
}

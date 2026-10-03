const typecheckTools = new Set(["flow", "svelte-check", "tsc", "vue-tsc"]);
const buildCommands = new Map([
  ["astro", "build"],
  ["ng", "build"],
  ["next", "build"],
  ["nuxt", "build"],
  ["parcel", "build"],
  ["react-scripts", "build"],
  ["vite", "build"],
  ["vue-cli-service", "build"],
]);
const buildToolsWithoutSubcommand = new Set(["esbuild", "rollup", "webpack"]);

export function validateProfileScriptCommand(name, command) {
  if ((name === "typecheck" || name === "build") && /[;&|<>`$()\\"'\r\n]/u.test(command))
    return `package.json.scripts.${name} must invoke one direct validation tool command.`;
  const [executable, subcommand] = command.trim().split(/\s+/u);
  const tool = executable
    .split(/[\\/]/u)
    .at(-1)
    .replace(/\.(?:cmd|exe|mjs)$/iu, "");
  if (name === "typecheck")
    return typecheckTools.has(tool)
      ? null
      : `package.json.scripts.${name} must invoke a direct typechecker.`;
  if (name !== "build") return null;
  if (
    (buildCommands.has(tool) && buildCommands.get(tool) === subcommand) ||
    buildToolsWithoutSubcommand.has(tool)
  )
    return null;
  return `package.json.scripts.${name} must invoke a direct build tool.`;
}

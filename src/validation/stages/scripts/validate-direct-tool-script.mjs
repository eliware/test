const TOOL_NAMES = {
  build: new Map([
    ["esbuild", "esbuild"],
    ["next", "next"],
    ["parcel", "parcel"],
    ["rollup", "rollup"],
    ["tsup", "tsup"],
    ["vite", "vite"],
    ["webpack", "webpack"],
  ]),
  typecheck: new Map([
    ["swc", "@swc/cli"],
    ["tsc", "typescript"],
    ["tsc-alias", "tsc-alias"],
    ["vue-tsc", "vue-tsc"],
  ]),
};

function firstCommandToken(script) {
  return script
    .trim()
    .split(/\s+/u)[0]
    .replace(/^.*[\\/]/u, "")
    .replace(/\.(?:cmd|exe|js|mjs)$/iu, "")
    .toLowerCase();
}

export function validateDirectToolScript(script, kind, packageJson = {}) {
  if (typeof script !== "string" || !script.trim()) return `The ${kind} script must be nonempty.`;
  if (/[\r\n;&|<>`()]|\$\(|%[^%]+%/u.test(script))
    return `The ${kind} script must contain one command without chaining or redirection.`;
  const token = firstCommandToken(script);
  if (
    token === "npm" ||
    token === "npx" ||
    token === "pnpm" ||
    token === "yarn" ||
    token === "eliware-test"
  ) {
    return `The ${kind} script must invoke its direct tool, not another package script or eliware-test.`;
  }
  const packageName = TOOL_NAMES[kind]?.get(token);
  if (!packageName) {
    return `The ${kind} script must begin with a recognized direct ${kind} tool.`;
  }
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  if (!sections.some((section) => Object.hasOwn(packageJson[section] ?? {}, packageName)))
    return `The ${kind} tool ${packageName} must be declared in package.json.`;
  return null;
}

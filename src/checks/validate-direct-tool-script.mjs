const TOOL_NAMES = {
  build: new Set(["esbuild", "next", "parcel", "rollup", "tsup", "vite", "webpack"]),
  typecheck: new Set(["swc", "tsc", "tsc-alias", "vue-tsc"]),
};

function firstCommandToken(script) {
  return script.trim().split(/\s+/u)[0].replace(/^.*[\\/]/u, "").replace(/\.(?:cmd|exe|js|mjs)$/iu, "").toLowerCase();
}

export function validateDirectToolScript(script, kind) {
  if (typeof script !== "string" || !script.trim()) return `The ${kind} script must be nonempty.`;
  const token = firstCommandToken(script);
  if (token === "npm" || token === "npx" || token === "pnpm" || token === "yarn" || token === "eliware-test") {
    return `The ${kind} script must invoke its direct tool, not another package script or eliware-test.`;
  }
  if (!TOOL_NAMES[kind]?.has(token)) {
    return `The ${kind} script must begin with a recognized direct ${kind} tool.`;
  }
  return null;
}

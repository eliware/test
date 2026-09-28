const commands = {
  test: "node bin/eliware-test.mjs",
  lint: "node bin/eliware-test.mjs --lint",
  audit: "node bin/eliware-test.mjs --audit",
  format: "node bin/eliware-test.mjs --format",
  "format:check": "node bin/eliware-test.mjs --format-check",
  pack: "node bin/eliware-test.mjs --pack",
};

export function resolveSelfHostedScriptCommands(requiredNames) {
  const scripts = {};
  const failures = [];
  for (const name of requiredNames) {
    if (!Object.hasOwn(commands, name)) {
      failures.push(`No self-hosted command is defined for required script ${name}.`);
      continue;
    }
    scripts[name] = commands[name];
  }
  return { scripts, failures };
}

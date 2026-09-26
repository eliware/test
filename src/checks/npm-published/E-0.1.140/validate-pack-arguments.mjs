const protectedOptions = new Set([
  "--dry-run", "--no-dry-run", "--json", "--no-json", "--pack-destination",
  "--prefix", "--workspace", "--workspaces", "--include-workspace-root", "-w", "-C",
]);
const valueOptions = new Set(["--loglevel"]);

export function validatePackArguments(args = []) {
  let expectsValue = false;
  for (const argument of args) {
    if (expectsValue) {
      if (argument.startsWith("-")) {
        const option = argument.split("=", 1)[0];
        if (isProtectedOption(option)) return protectedArgumentError(argument);
        return "Pack argument --loglevel requires a value.";
      }
      expectsValue = false;
      continue;
    }
    const option = argument.split("=", 1)[0];
    if (argument === "--" || isProtectedOption(option)) return protectedArgumentError(argument);
    if (!argument.startsWith("-")) {
      return `Pack arguments cannot select a package to pack: ${argument}.`;
    }
    expectsValue = valueOptions.has(option) && !argument.includes("=");
  }
  if (expectsValue) return "Pack argument --loglevel requires a value.";
  return null;
}

function isProtectedOption(option) {
  return protectedOptions.has(option) || /^-(?:w|C).+$/u.test(option);
}

function protectedArgumentError(argument) {
  return `Pack arguments cannot override dry-run, JSON output, output location, or package selection: ${argument}.`;
}

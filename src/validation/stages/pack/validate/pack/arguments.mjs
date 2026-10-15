const protectedOptions = new Set([
  "--dry-run",
  "--no-dry-run",
  "--json",
  "--no-json",
  "--pack-destination",
  "--consumer-smoke",
  "--prefix",
  "--workspace",
  "--workspaces",
  "--include-workspace-root",
  "-w",
  "-C",
]);
const valueOptions = new Set(["--loglevel"]);

export function validatePackArguments(args = []) {
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== "string"))
    return "Pack arguments must be provided as an array of strings.";
  let expectsValue = false;
  const failures = [];
  for (const argument of args) {
    if (expectsValue) {
      if (argument.startsWith("-")) {
        const option = argument.split("=", 1)[0];
        if (isProtectedOption(option)) failures.push(protectedArgumentError(argument));
        else failures.push("Pack argument --loglevel requires a value.");
      } else {
        expectsValue = false;
        continue;
      }
    }
    const option = argument.split("=", 1)[0];
    if (argument === "--" || isProtectedOption(option)) {
      failures.push(protectedArgumentError(argument));
      continue;
    }
    if (!argument.startsWith("-")) {
      failures.push(`Pack arguments cannot select a package to pack: ${argument}.`);
      continue;
    }
    expectsValue = valueOptions.has(option) && !argument.includes("=");
  }
  if (expectsValue) failures.push("Pack argument --loglevel requires a value.");
  return failures.length ? failures.join("\n") : null;
}

function isProtectedOption(option) {
  return protectedOptions.has(option) || /^-(?:w|C).+$/u.test(option);
}

function protectedArgumentError(argument) {
  return `Pack arguments cannot override dry-run, JSON output, output location, or package selection: ${argument}.`;
}

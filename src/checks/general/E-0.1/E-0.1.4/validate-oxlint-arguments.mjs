const threadsArgument = /^--threads=[1-9]\d*$/u;

export function validateOxlintArguments(args = []) {
  if (!Array.isArray(args) || Array.from(args).some((argument) => typeof argument !== "string")) {
    return "Oxlint arguments must be an array of strings.";
  }
  if (args.some((argument) => !threadsArgument.test(argument))) {
    return "Oxlint arguments may only set a positive --threads=<count> value.";
  }
  return null;
}

export function createJestEnvironment(invokingEnvironment = process.env) {
  const existingNodeOptions = invokingEnvironment.NODE_OPTIONS?.trim() ?? "";
  const hasOption = (option) =>
    new RegExp(`(?:^|[\\s])${option.replace("-", "\\-")}(?:$|[\\s])`).test(existingNodeOptions);
  const nodeOptions = [
    existingNodeOptions,
    hasOption("--experimental-vm-modules") ? "" : "--experimental-vm-modules",
    /(?:^|[\s])(?:--trace-warnings|--no-warnings)(?:$|[\s])/.test(existingNodeOptions)
      ? ""
      : "--no-warnings",
  ]
    .filter(Boolean)
    .join(" ");
  return { ...invokingEnvironment, NODE_OPTIONS: nodeOptions };
}

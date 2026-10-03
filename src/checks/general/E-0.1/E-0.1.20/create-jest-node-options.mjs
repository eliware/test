const allowedOptions = new Set(["--experimental-vm-modules", "--no-warnings", "--trace-warnings"]);

export function createJestNodeOptions(value = "") {
  // codescope ignore: only allowlisted flag tokens are valid; quotes and backslashes are unsupported tokenization.
  if (typeof value === "string" && /["'\\]/u.test(value)) {
    throw new Error("Unsupported inherited NODE_OPTIONS for the Jest validation process.");
  }
  const inherited = typeof value === "string" && value.trim() ? value.trim().split(/\s+/u) : [];
  if (inherited.some((option) => !isAllowedOption(option))) {
    throw new Error("Unsupported inherited NODE_OPTIONS for the Jest validation process.");
  }
  const options = new Set(inherited);
  options.add("--experimental-vm-modules");
  if (
    ![...options].some(
      (option) => option === "--trace-warnings" || option.startsWith("--trace-warnings="),
    ) &&
    !options.has("--no-warnings")
  ) {
    options.add("--no-warnings");
  }
  return [...options].join(" ");
}

function isAllowedOption(option) {
  const [name, value] = option.split("=", 2);
  if (!allowedOptions.has(name)) return false;
  if (value === undefined) return true;
  return name === "--trace-warnings" && ["true", "false"].includes(value);
}

const allowedOptions = new Set([
  "--experimental-vm-modules",
  "--no-warnings",
  "--trace-warnings",
]);

export function createJestNodeOptions(value = "") {
  if (typeof value === "string" && /[="'\\]/u.test(value)) {
    throw new Error("Unsupported inherited NODE_OPTIONS for the Jest validation process.");
  }
  const inherited = typeof value === "string" && value.trim() ? value.trim().split(/\s+/u) : [];
  if (inherited.some((option) => !allowedOptions.has(option))) {
    throw new Error("Unsupported inherited NODE_OPTIONS for the Jest validation process.");
  }
  const options = new Set(inherited);
  options.add("--experimental-vm-modules");
  if (!options.has("--trace-warnings") && !options.has("--no-warnings")) {
    options.add("--no-warnings");
  }
  return [...options].join(" ");
}

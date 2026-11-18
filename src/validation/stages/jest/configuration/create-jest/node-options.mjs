const allowedOptions = new Set([
  "--experimental-vm-modules",
  "--max-old-space-size",
  "--no-warnings",
  "--trace-warnings",
]);
export default function createJestNodeOptions(value = "", { detectOpenHandles = false } = {}) {
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
  if (detectOpenHandles) options.add("--max-old-space-size=4096");
  return [...options].join(" ");
}
function isAllowedOption(option) {
  const [name, value] = option.split("=", 2);
  if (!allowedOptions.has(name)) return false;
  if (value === undefined) return true;
  if (name === "--max-old-space-size") return /^\d+$/u.test(value) && Number(value) > 0;
  return name === "--trace-warnings" && ["true", "false"].includes(value);
}

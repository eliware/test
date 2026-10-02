const dispatchInputTypes = new Set(["boolean", "choice", "environment", "number", "string"]);
const callInputTypes = new Set(["boolean", "number", "string"]);

export function isValidEventDetails(event, field, value) {
  if (!isRecord(value)) return false;
  if (field === "inputs") return validateInputs(event, value);
  if (field === "outputs" && event === "workflow_call") return validateOutputs(value);
  if (field === "secrets" && event === "workflow_call") return validateSecrets(value);
  return false;
}

function validateInputs(event, inputs) {
  const allowedTypes = event === "workflow_dispatch" ? dispatchInputTypes : callInputTypes;
  return Object.entries(inputs).every(([name, options]) => {
    if (!isIdentifier(name) || !isRecord(options)) return false;
    const fields =
      event === "workflow_dispatch"
        ? ["description", "required", "default", "type", "options"]
        : ["description", "required", "default", "type"];
    if (!Object.keys(options).every((field) => fields.includes(field))) return false;
    if ("description" in options && typeof options.description !== "string") return false;
    if ("required" in options && typeof options.required !== "boolean") return false;
    if ("default" in options && !isValidDefault(options.default, options.type)) return false;
    if (event === "workflow_call" && !allowedTypes.has(options.type)) return false;
    if ("type" in options && !allowedTypes.has(options.type)) return false;
    if (
      "options" in options &&
      (options.type !== "choice" ||
        !isStringList(options.options) ||
        !hasUniqueOptions(options.options))
    )
      return false;
    if (options.type !== "choice") return true;
    return (
      isStringList(options.options) &&
      hasUniqueOptions(options.options) &&
      (options.default === undefined || options.options.includes(options.default))
    );
  });
}

function validateOutputs(outputs) {
  return Object.entries(outputs).every(([name, options]) => {
    if (!isIdentifier(name) || !isRecord(options)) return false;
    if (!Object.keys(options).every((field) => ["description", "value"].includes(field)))
      return false;
    return (
      typeof options.value === "string" &&
      options.value.length > 0 &&
      (options.description === undefined || typeof options.description === "string")
    );
  });
}

function validateSecrets(secrets) {
  return Object.entries(secrets).every(([name, options]) => {
    if (!isIdentifier(name) || !isRecord(options)) return false;
    if (!Object.keys(options).every((field) => ["description", "required"].includes(field)))
      return false;
    return (
      (options.description === undefined || typeof options.description === "string") &&
      (options.required === undefined || typeof options.required === "boolean")
    );
  });
}

function isIdentifier(value) {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/u.test(value);
}

function isStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonemptyString);
}

function isValidDefault(value, type) {
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "string";
}

function hasUniqueOptions(options) {
  return new Set(options).size === options.length;
}

function isNonemptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

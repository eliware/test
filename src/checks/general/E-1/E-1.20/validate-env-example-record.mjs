const sensitiveValue = /(?:token|secret|password|private|credential)/i;

function metadataError(value, details) {
  if (!Object.hasOwn(details, "default") || !details.default) return "must document a nonempty default";
  if (Object.hasOwn(details, "allowed")) {
    const allowed = details.allowed.split(/\s*(?:\||,)\s*/u).filter(Boolean);
    if (allowed.length === 0 || !allowed.includes(value)) return "has a default outside its allowed values";
  }
  if (Object.hasOwn(details, "range")) {
    const match = details.range.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(?:\.\.|-|,)\s*([+-]?\d+(?:\.\d+)?)\s*$/u);
    const numeric = Number(value);
    if (!match || !Number.isFinite(numeric) || numeric < Number(match[1]) || numeric > Number(match[2])) {
      return "has a default outside its allowed range";
    }
  }
  return null;
}

export function validateEnvironmentRecord({ name, value, optional, details, duplicate }) {
  const errors = [];
  if (duplicate) errors.push(`${name} is declared more than once`);
  if (!value) errors.push(`${name} needs an explicit default or placeholder value`);
  if (!optional && sensitiveValue.test(value)) errors.push(`${name} must not contain a credential-like value`);
  if (value) {
    const issue = metadataError(value, details);
    if (issue) errors.push(`${name} ${issue}`);
  }
  if (Object.entries(details).some(([, detail]) => !detail)) {
    errors.push(`${name} must not use empty environment metadata`);
  }
  return errors;
}

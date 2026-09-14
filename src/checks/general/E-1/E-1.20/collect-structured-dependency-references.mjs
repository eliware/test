export function collectStructuredValues(value, declared, referenced) {
  if (typeof value === "string") {
    for (const name of declared) {
      if (value === name || value.split(/\s+/).includes(name) || value.includes(`${name}/`)) referenced.add(name);
    }
  } else if (Array.isArray(value)) value.forEach((entry) => collectStructuredValues(entry, declared, referenced));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => collectStructuredValues(entry, declared, referenced));
}

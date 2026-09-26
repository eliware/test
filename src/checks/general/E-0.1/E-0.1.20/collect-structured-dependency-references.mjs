const referenceKeys = new Set(["bin", "command", "commands", "entry", "executable", "extends", "import", "imports", "loader", "moduleNameMapper", "plugin", "plugins", "preset", "presets", "scripts", "transform", "use", "webpack", "rollup"]);

export function collectStructuredValues(value, declared, referenced, active = false) {
  if (typeof value === "string") {
    if (!active) return;
    for (const name of declared) {
      if (value === name || value.split(/\s+/).includes(name) || value.includes(`${name}/`)) referenced.add(name);
    }
  } else if (Array.isArray(value)) value.forEach((entry) => collectStructuredValues(entry, declared, referenced, active));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => collectStructuredValues(entry, declared, referenced, active || referenceKeys.has(key)));
}

export function collectScriptReferences(scripts, declared, referenced) {
  for (const script of Object.values(scripts ?? {})) {
    if (typeof script !== "string") continue;
    for (const name of declared) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|\\s|[\\"'])${escaped}(?:$|\\s|[/\\"'])`).test(script)) referenced.add(name);
    }
  }
}

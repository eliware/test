export function collectScriptReferences(
  scripts,
  declared,
  referenced,
  dependencyBinaries = new Map(),
) {
  for (const script of Object.values(scripts ?? {})) {
    if (typeof script !== "string") continue;
    for (const name of declared) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|\\s|[\\"'])${escaped}(?:$|\\s|[/\\"'])`).test(script))
        referenced.add(name);
    }
    for (const [binary, dependency] of dependencyBinaries) {
      const escaped = binary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const command = new RegExp(`(?:^|&&\\s*|\\|\\|\\s*|[;|]\\s*)${escaped}(?=$|\\s)`);
      const localPath = new RegExp(
        `(?:^|[\\s"'=])(?:[^\\s"'=]*[/\\\\])?node_modules[/\\\\]\\.bin[/\\\\]${escaped}(?:\\.cmd)?(?=$|[\\s"';&|])`,
        "i",
      );
      if (command.test(script) || localPath.test(script)) referenced.add(dependency);
    }
  }
}

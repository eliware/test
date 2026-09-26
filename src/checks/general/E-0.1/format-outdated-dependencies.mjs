export function formatOutdatedDependencies(outdated) {
  return Object.entries(outdated ?? {}).map(([name, info]) => `${name} (${info.current ?? "unknown"} -> ${info.latest ?? info.wanted ?? "unknown"})`);
}

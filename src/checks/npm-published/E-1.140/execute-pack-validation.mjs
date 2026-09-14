export async function executePackValidation({
  root,
  executePack,
  mode,
  runPack,
}) {
  if (!executePack || (mode !== null && mode !== "pack")) return null;
  try {
    const result = await runPack(root);
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return detail ? `npm pack failed: ${detail}` : "npm pack failed without diagnostics.";
    }
  } catch (error) {
    return `npm pack could not be started: ${error.message}`;
  }
  return null;
}

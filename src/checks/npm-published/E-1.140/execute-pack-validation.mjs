export async function executePackValidation({
  root,
  packageJson,
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
    const manifestError = validatePackManifest(result.stdout ?? "", packageJson?.files);
    if (manifestError) return manifestError;
  } catch (error) {
    return `npm pack could not be started: ${error.message}`;
  }
  return null;
}
import { validatePackManifest } from "./validate-pack-manifest.mjs";

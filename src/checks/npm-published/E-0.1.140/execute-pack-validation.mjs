import { execute } from "../../execute-child-process.mjs";
import { validatePackManifest } from "./validate-pack-manifest.mjs";

export async function executePackValidation({
  root,
  packageJson,
  executePack,
  mode,
  runPack,
  toolArgs = [],
}) {
  if (!executePack || (mode !== null && mode !== "pack")) return null;
  try {
    const result = await runPack(root, execute, undefined, toolArgs);
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

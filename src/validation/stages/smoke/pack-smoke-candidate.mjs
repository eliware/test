import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { readPackManifest } from "../pack/read-pack-manifest.mjs";
import { validatePackManifest } from "../pack/validate-pack-manifest.mjs";

function commandFailure(result, label) {
  const detail = [result?.stdout, result?.stderr].filter(Boolean).join("\n").trim();
  return label + (detail ? ": " + detail : ".");
}

export async function packSmokeCandidate({
  root,
  packageJson,
  run,
  command,
  prefix,
  packDirectory,
  env,
}) {
  const packed = await run(
    command,
    [...prefix, "pack", "--ignore-scripts", "--json", "--pack-destination", packDirectory],
    { cwd: root, env },
  );
  if (packed.code !== 0) throw new Error(commandFailure(packed, "npm pack failed"));
  const manifestText = packed.stdout ?? "";
  const manifest = readPackManifest(manifestText, packageJson.name);
  const filename = manifest.entry?.filename;
  if (manifest.error || typeof filename !== "string" || basename(filename) !== filename)
    throw new Error("npm pack did not return a safe tarball filename.");
  if (manifest.entry.version !== packageJson.version)
    throw new Error("Packed tarball version does not match package.json.");
  const packError = validatePackManifest(
    manifestText,
    packageJson.files,
    packageJson.name,
    packageJson,
  );
  if (packError) throw new Error(packError);
  const tarball = join(packDirectory, filename);
  const digest = createHash("sha256")
    .update(await readFile(tarball))
    .digest("hex");
  return { tarball, digest };
}

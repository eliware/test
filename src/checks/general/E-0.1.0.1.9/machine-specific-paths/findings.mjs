import { hasPosixMachineSpecificPath } from "./posix-paths.mjs";
import { hasWindowsMachineSpecificPath } from "./windows-paths.mjs";

export async function findMachineSpecificPaths(files, readBytes) {
  const findings = [];
  for (const file of files) {
    const content = decodeText(await readBytes(file));
    if (
      content !== null &&
      (hasWindowsMachineSpecificPath(content) || hasPosixMachineSpecificPath(content))
    )
      findings.push(file);
  }
  return findings;
}

function decodeText(bytes) {
  if (bytes.includes(0)) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

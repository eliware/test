import { hasMachineSpecificPathBytes } from "./has-machine-specific-path-bytes.mjs";

export async function findMachineSpecificPaths(files, readBytes) {
  const findings = [];
  for (const file of files) {
    if (hasMachineSpecificPathBytes(await readBytes(file))) findings.push(file);
  }
  return findings;
}

import { hasPosixMachineSpecificPath } from "./posix-paths.mjs";
import { hasWindowsMachineSpecificPath } from "./windows-paths.mjs";

export function hasMachineSpecificPathBytes(bytes) {
  if (bytes.includes(0)) return false;
  let content;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  return hasWindowsMachineSpecificPath(content) || hasPosixMachineSpecificPath(content);
}

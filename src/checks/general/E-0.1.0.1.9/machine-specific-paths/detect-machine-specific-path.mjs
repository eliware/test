import { hasPosixMachineSpecificPath } from "./posix-paths.mjs";
import { hasWindowsMachineSpecificPath } from "./windows-paths.mjs";

export function detectMachineSpecificPath(content) {
  return hasWindowsMachineSpecificPath(content) || hasPosixMachineSpecificPath(content);
}

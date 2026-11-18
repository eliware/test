import hasPosixMachineSpecificPath from "./posix-paths.mjs";
import hasWindowsMachineSpecificPath from "./windows-paths.mjs";
export default function detectMachineSpecificPath(content) {
  return hasWindowsMachineSpecificPath(content) || hasPosixMachineSpecificPath(content);
}

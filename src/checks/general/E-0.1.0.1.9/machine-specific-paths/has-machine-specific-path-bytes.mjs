import { hasPosixMachineSpecificPath } from "./posix-paths.mjs";
import { hasWindowsMachineSpecificPath } from "./windows-paths.mjs";
import { decodeRepositoryText } from "./decode-repository-text.mjs";

export function hasMachineSpecificPathBytes(bytes) {
  const content = decodeRepositoryText(bytes);
  return (
    content !== null &&
    (hasWindowsMachineSpecificPath(content) || hasPosixMachineSpecificPath(content))
  );
}

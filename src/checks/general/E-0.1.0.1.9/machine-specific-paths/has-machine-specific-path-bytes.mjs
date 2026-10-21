import { decodeRepositoryText } from "./decode-repository-text.mjs";
import { detectMachineSpecificPath } from "./detect-machine-specific-path.mjs";

export function hasMachineSpecificPathBytes(bytes) {
  const content = decodeRepositoryText(bytes);
  return content !== null && detectMachineSpecificPath(content);
}

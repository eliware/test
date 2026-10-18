import { validateBinEntries } from "./validate-bin/entries.mjs";
import { validateBinShape } from "./validate-bin/shape.mjs";

export function validateEntrypointMetadata(packageJson) {
  const bin = packageJson.bin;
  return [...validateBinShape(bin), ...validateBinEntries(bin)];
}

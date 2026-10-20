import { collectNestedStringValues } from "../../../validation/shared/package/collect-nested-string-values.mjs";

export function collectLibraryExportTargets(value, targets = []) {
  return collectNestedStringValues(value, targets);
}

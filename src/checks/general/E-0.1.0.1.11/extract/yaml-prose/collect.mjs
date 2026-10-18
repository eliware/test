import { isMap, isScalar, isSeq } from "yaml";

export function visitYamlScalars(node, visit, path = []) {
  if (isMap(node)) {
    for (const item of node.items) {
      visitYamlScalars(item.value, visit, [...path, String(item.key.value).toLowerCase()]);
    }
    return;
  }
  if (isSeq(node)) {
    for (const item of node.items) visitYamlScalars(item, visit, path);
    return;
  }
  if (isScalar(node)) visit(node, path);
}

import { isAbsolute, join, resolve } from "node:path";
export default function inventoryPath(root, filePath) {
  return resolve(isAbsolute(filePath) ? filePath : join(root, filePath));
}

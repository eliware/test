import { posix } from "node:path";
function isSpecificationsIndexTarget(target) {
  const unwrapped = target.replace(/^<|>$/gu, "").split(/[?#]/u, 1)[0];
  return (
    posix.normalize(unwrapped.replaceAll("\\", "/").replace(/^\.\//u, "")) === "specs/README.md"
  );
}
export default isSpecificationsIndexTarget;

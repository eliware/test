import { memberName } from "./member-name.mjs";

const domTextProperties = new Set([
  "ariaLabel",
  "innerText",
  "placeholder",
  "textContent",
  "title",
]);

export function isUserFacingOutputProperty(target) {
  return target?.type === "MemberExpression" && domTextProperties.has(memberName(target));
}

import { memberName } from "../member-name.mjs";

export function isProcessOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "MemberExpression" &&
    callee.object.object?.type === "Identifier" &&
    callee.object.object.name === "process" &&
    ["stderr", "stdout"].includes(memberName(callee.object)) &&
    memberName(callee) === "write"
  );
}

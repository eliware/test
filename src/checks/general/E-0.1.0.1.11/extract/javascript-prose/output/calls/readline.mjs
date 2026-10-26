import { memberName } from "../member-name.mjs";

export function isReadlineOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "readline" &&
    memberName(callee) === "question"
  );
}

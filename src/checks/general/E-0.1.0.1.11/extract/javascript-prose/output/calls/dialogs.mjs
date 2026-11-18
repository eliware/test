import memberName from "../member-name.mjs";
const promptMethods = new Set(["alert", "confirm", "prompt"]);
export default function isDialogOutputCall(callee) {
  if (callee?.type === "Identifier") return promptMethods.has(callee.name);
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "window" &&
    promptMethods.has(memberName(callee))
  );
}

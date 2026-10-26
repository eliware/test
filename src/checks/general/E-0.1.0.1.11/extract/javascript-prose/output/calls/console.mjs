import { memberName } from "../member-name.mjs";

const consoleMethods = new Set(["error", "info", "log", "warn"]);

export function isConsoleOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "console" &&
    consoleMethods.has(memberName(callee))
  );
}

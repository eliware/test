import { isUserFacingAttribute } from "../attributes.mjs";
import { isUserFacingOutputCall } from "../calls.mjs";
import { isUserFacingOutputProperty } from "../properties.mjs";
import { addOutputProseBlocks } from "./blocks.mjs";

export function collectJavaScriptOutputProse(value, blocks) {
  if (value.type === "CallExpression" && isUserFacingOutputCall(value.callee)) {
    for (const argument of value.arguments)
      addOutputProseBlocks(argument, value.loc.start.line, blocks);
  }
  if (value.type === "AssignmentExpression" && isUserFacingOutputProperty(value.left))
    addOutputProseBlocks(value.right, value.loc.start.line, blocks);
  if (value.type === "CallExpression" && isSetAttributeOutput(value))
    addOutputProseBlocks(value.arguments[1], value.loc.start.line, blocks);
}

function isSetAttributeOutput(call) {
  return (
    call.callee?.type === "MemberExpression" &&
    !call.callee.computed &&
    call.callee.property?.name === "setAttribute" &&
    call.arguments[0]?.type === "StringLiteral" &&
    isUserFacingAttribute(call.arguments[0].value)
  );
}

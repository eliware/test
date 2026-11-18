import isUserFacingAttribute from "../attributes.mjs";
import addOutputProseBlocks from "./blocks.mjs";

export default function collectOutputAttributeProse(call, blocks) {
  if (
    call.callee?.type !== "MemberExpression" ||
    call.callee.computed ||
    call.callee.property?.name !== "setAttribute" ||
    call.arguments[0]?.type !== "StringLiteral" ||
    !isUserFacingAttribute(call.arguments[0].value)
  )
    return;
  addOutputProseBlocks(call.arguments[1], call.loc.start.line, blocks);
}

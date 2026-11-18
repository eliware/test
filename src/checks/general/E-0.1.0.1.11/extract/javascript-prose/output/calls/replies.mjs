import memberName from "../member-name.mjs";
const replyMethods = new Set(["editReply", "followUp", "reply"]);
export default function isReplyOutputCall(callee) {
  return callee?.type === "MemberExpression" && replyMethods.has(memberName(callee));
}

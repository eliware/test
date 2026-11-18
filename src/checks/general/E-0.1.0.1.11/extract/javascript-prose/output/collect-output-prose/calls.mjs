import isUserFacingOutputCall from "../calls.mjs";
import addOutputProseBlocks from "./blocks.mjs";

export default function collectOutputCallProse(call, blocks) {
  if (!isUserFacingOutputCall(call.callee)) return;
  for (const argument of call.arguments)
    addOutputProseBlocks(argument, call.loc.start.line, blocks);
}

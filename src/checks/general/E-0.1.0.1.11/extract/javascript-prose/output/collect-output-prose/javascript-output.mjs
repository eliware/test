import dispatchOutputCall from "./dispatch-output/call.mjs";
import dispatchOutputAssignment from "./dispatch-output/assignment.mjs";
export default function collectJavaScriptOutputProse(value, blocks) {
  dispatchOutputCall(value, blocks);
  dispatchOutputAssignment(value, blocks);
}

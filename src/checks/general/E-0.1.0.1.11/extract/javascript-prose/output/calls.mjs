import { isDialogOutputCall } from "./calls/dialogs.mjs";
import { isConsoleOutputCall } from "./calls/console.mjs";
import { isProcessOutputCall } from "./calls/process-streams.mjs";
import { isReadlineOutputCall } from "./calls/readline.mjs";
import { isReplyOutputCall } from "./calls/replies.mjs";

export function isUserFacingOutputCall(callee) {
  return (
    isDialogOutputCall(callee) ||
    isConsoleOutputCall(callee) ||
    isProcessOutputCall(callee) ||
    isReadlineOutputCall(callee) ||
    isReplyOutputCall(callee)
  );
}

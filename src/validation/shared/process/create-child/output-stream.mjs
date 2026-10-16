import { truncateChildOutputText } from "../truncate-child-output-text.mjs";

export function createChildOutputStream({ onStdout, onStderr }, outputLimit) {
  let streamed = 0;
  const stream = (callback, text) => {
    if (!callback || streamed >= outputLimit || text.length === 0) return;
    const bounded = truncateChildOutputText(text, outputLimit - streamed);
    streamed += bounded.length || outputLimit;
    if (bounded) callback(bounded);
  };
  return {
    stdout: (text) => stream(onStdout, text),
    stderr: (text) => stream(onStderr, text),
  };
}

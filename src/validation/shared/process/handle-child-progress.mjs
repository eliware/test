import { StringDecoder } from "node:string_decoder";

export function handleChildProgress(text, options) {
  if (!options.progressPattern?.test(text)) return false;
  if (!options.resetOnAnyOutput) options.resetProgressTimer();
  options.onProgress?.(text);
  return true;
}

export function createChildProgressHandler(options) {
  const decoder = new StringDecoder("utf8");
  const maximumPendingLineLength = options.maxProgressLineLength ?? 4096;
  let pending = "";
  let pendingOverflowed = false;
  const report = (text) => handleChildProgress(options.redactProgressText?.(text) ?? text, options);
  return {
    push(chunk) {
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      if (options.resetOnAnyOutput && text.length > 0) options.resetProgressTimer();
      const lines = text.split(/\r?\n/u);
      if (pendingOverflowed) {
        if (lines.length === 1) return;
        lines.shift();
        pendingOverflowed = false;
      } else {
        lines[0] = pending + lines[0];
      }
      const nextPending = lines.pop();
      for (const line of lines) if (line.length <= maximumPendingLineLength) report(line);
      pendingOverflowed = nextPending.length > maximumPendingLineLength;
      pending = pendingOverflowed ? "" : nextPending;
    },
    flush() {
      const finalLine = pending + decoder.end();
      if (!pendingOverflowed && finalLine.length <= maximumPendingLineLength) report(finalLine);
      pending = "";
      pendingOverflowed = false;
    },
  };
}

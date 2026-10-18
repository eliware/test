import { StringDecoder } from "node:string_decoder";

export function createProgressLineBuffer({ onLine, onText, maxLineLength = 4096 }) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let pendingOverflowed = false;
  function push(chunk) {
    const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    if (text) onText?.(text);
    const lines = text.split(/\r?\n/u);
    if (pendingOverflowed) {
      if (lines.length === 1) return;
      lines.shift();
      pendingOverflowed = false;
    } else {
      lines[0] = pending + lines[0];
    }
    const nextPending = lines.pop();
    for (const line of lines) if (line.length <= maxLineLength) onLine(line);
    pendingOverflowed = nextPending.length > maxLineLength;
    pending = pendingOverflowed ? "" : nextPending;
  }
  function flush() {
    const tail = decoder.end();
    if (tail) onText?.(tail);
    const finalLine = pending + tail;
    if (!pendingOverflowed && finalLine.length <= maxLineLength) onLine(finalLine);
    pending = "";
    pendingOverflowed = false;
  }
  return Object.freeze({ push, flush });
}

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
      // codescope ignore: marker-based progress is matched after partial chunks are joined to a complete line; split-marker behavior is covered by tests
      const lines = `${pending}${text}`.split(/\r?\n/u);
      const previousLineOverflowed = pendingOverflowed;
      const nextPending = lines.pop();
      for (const [index, line] of lines.entries()) {
        if (!(index === 0 && previousLineOverflowed) && line.length <= maximumPendingLineLength)
          report(line);
      }
      pendingOverflowed = nextPending.length > maximumPendingLineLength;
      pending = nextPending.slice(0, maximumPendingLineLength);
    },
    flush() {
      const finalLine = pending + decoder.end();
      if (!pendingOverflowed && finalLine.length <= maximumPendingLineLength) report(finalLine);
      pending = "";
      pendingOverflowed = false;
    },
  };
}

import { createProgressLineBuffer } from "../create-progress-line-buffer.mjs";

export function handleChildProgress(text, options) {
  if (!options.progressPattern?.test(text)) return false;
  if (!options.resetOnAnyOutput) options.resetProgressTimer();
  options.onProgress?.(text);
  return true;
}

export function createChildProgressHandler(options) {
  const report = (text) => {
    const redacted = options.redactProgressText?.(text);
    if (redacted === "" && options.progressPattern?.test(text)) {
      if (!options.resetOnAnyOutput) options.resetProgressTimer();
      return true;
    }
    return handleChildProgress(redacted ?? text, options);
  };
  const lines = createProgressLineBuffer({
    maxLineLength: options.maxProgressLineLength ?? 4096,
    onLine: report,
    onText: (text) => {
      if (options.resetOnAnyOutput && text.length > 0) options.resetProgressTimer();
    },
  });
  return {
    push: lines.push,
    flush: lines.flush,
  };
}

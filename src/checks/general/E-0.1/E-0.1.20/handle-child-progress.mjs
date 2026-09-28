import { StringDecoder } from "node:string_decoder";

export function handleChildProgress(text, options) {
  if (!options.progressPattern?.test(text)) return false;
  if (!options.resetOnAnyOutput) options.resetProgressTimer();
  options.onProgress?.(text);
  return true;
}

export function createChildProgressHandler(options) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  const report = (text) => handleChildProgress(options.redactProgressText?.(text) ?? text, options);
  return {
    push(chunk) {
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      if (options.resetOnAnyOutput && text.length > 0) options.resetProgressTimer();
      const lines = `${pending}${text}`.split(/\r?\n/u);
      pending = lines.pop();
      for (const line of lines) {
        report(line);
      }
    },
    flush() {
      report(pending + decoder.end());
      pending = "";
    },
  };
}

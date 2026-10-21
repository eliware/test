import { createRedactedStreamBuffer } from "../stream/buffer.mjs";

export function createRedactedTextStreamSession(
  policy,
  decoder,
  output,
  outputLimit,
  createBuffer = createRedactedStreamBuffer,
) {
  let suppressed = policy.suppressed;
  let finished = false;
  const streamBuffer = createBuffer({
    pendingLimit: policy.pendingLimit,
    bufferLimit: outputLimit,
    decoder,
    findSafeBoundary: policy.findSafeBoundary,
    trimSuffix: policy.trimSuffix,
    append: output.append,
    canContinue: () => !suppressed && output.canContinue(),
    suppress: () => {
      suppressed = true;
    },
  });

  return {
    push(chunk) {
      if (finished || suppressed) return "";
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return streamBuffer.addText(text);
    },
    finish() {
      if (finished) return "";
      finished = true;
      return streamBuffer.finish();
    },
    get suppressed() {
      return suppressed;
    },
  };
}

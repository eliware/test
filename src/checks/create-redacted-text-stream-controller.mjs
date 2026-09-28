import { StringDecoder } from "node:string_decoder";
import { createRedactedStreamBuffer } from "./create-redacted-stream-buffer.mjs";
import { createRedactedStreamOutput } from "./create-redacted-stream-output.mjs";

export function createRedactedTextStreamSession(policy, outputLimit) {
  let suppressed = policy.suppressed;
  const decoder = new StringDecoder("utf8");
  const output = createRedactedStreamOutput(outputLimit);
  const streamBuffer = createRedactedStreamBuffer({
    pendingLimit: policy.pendingLimit,
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
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return streamBuffer.addText(text);
    },
    finish: streamBuffer.finish,
    get suppressed() {
      return suppressed;
    },
  };
}

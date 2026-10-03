import { StringDecoder } from "node:string_decoder";
import { createRedactedStreamBuffer } from "./create-redacted-stream-buffer.mjs";
import { createRedactedStreamOutput } from "./create-redacted-stream-output.mjs";

/** Finishing closes the stream; later pushes and repeated finishes return an empty string. */
export function createRedactedTextStreamSession(policy, outputLimit) {
  let suppressed = policy.suppressed;
  const decoder = new StringDecoder("utf8");
  const output = createRedactedStreamOutput(outputLimit);
  let finished = false;
  const streamBuffer = createRedactedStreamBuffer({
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
      if (finished) return "";
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
